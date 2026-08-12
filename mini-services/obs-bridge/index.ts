import { createHash, randomUUID } from "node:crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BridgeSession {
  ws: WebSocket;
  obsVersion?: string;
  rpcVersion?: number;
}

interface ObsMessage {
  op: number;
  d?: Record<string, unknown>;
}

interface HelloMessage extends ObsMessage {
  op: 0;
  d: {
    rpcVersion: number;
    authentication?: {
      challenge: string;
      salt: string;
    };
  };
}

interface IdentifiedMessage extends ObsMessage {
  op: 2;
  d: {
    negotiatedRpcVersion: number;
  };
}

interface RequestResponseMessage extends ObsMessage {
  op: 7;
  d: {
    requestId: string;
    requestStatus: {
      result: boolean;
      code: number;
      comment?: string;
    };
    responseData?: Record<string, unknown>;
  };
}

// ─── State ────────────────────────────────────────────────────────────────────

const bridgeSessions = new Map<string, BridgeSession>();
const pendingRequests = new Map<
  string,
  {
    resolve: (value: unknown) => void;
    reject: (reason: string) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();

const RPC_TIMEOUT_MS = 5000;
const LOG_PREFIX = "[OBS-Bridge]";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(...args: unknown[]) {
  console.log(LOG_PREFIX, ...args);
}

function logError(...args: unknown[]) {
  console.error(LOG_PREFIX, ...args);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}

function readBody(req: Request): Promise<Record<string, unknown>> {
  return req.json() as Promise<Record<string, unknown>>;
}

function sendObsRequest(
  bridgeId: string,
  requestType: string,
  requestData: Record<string, unknown>
): Promise<unknown> {
  const session = bridgeSessions.get(bridgeId);
  if (!session || session.ws.readyState !== WebSocket.OPEN) {
    return Promise.reject("OBS connection not established or closed");
  }

  const requestId = `req_${Date.now()}`;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(requestId);
      reject(`OBS request '${requestType}' timed out after ${RPC_TIMEOUT_MS}ms`);
    }, RPC_TIMEOUT_MS);

    pendingRequests.set(requestId, { resolve, reject, timer });

    const message: ObsMessage = {
      op: 6,
      d: { requestType, requestId, requestData },
    };

    log(`Sending RPC ${requestType} (requestId=${requestId})`);
    session.ws.send(JSON.stringify(message));
  });
}

function setupObsMessageHandler(bridgeId: string, ws: WebSocket) {
  ws.onmessage = (event: MessageEvent) => {
    try {
      const msg = JSON.parse(event.data as string) as ObsMessage;

      // Handle RPC responses (op 7)
      if (msg.op === 7 && msg.d) {
        const resp = msg.d as unknown as RequestResponseMessage["d"];
        const pending = pendingRequests.get(resp.requestId);
        if (pending) {
          clearTimeout(pending.timer);
          pendingRequests.delete(resp.requestId);

          if (resp.requestStatus?.result) {
            log(
              `RPC response success: ${resp.requestId}`,
              resp.responseData ? JSON.stringify(resp.responseData) : ""
            );
            pending.resolve(resp.responseData || {});
          } else {
            const errMsg =
              resp.requestStatus?.comment ||
              `OBS returned error code ${resp.requestStatus?.code}`;
            logError(`RPC response error: ${resp.requestId} — ${errMsg}`);
            pending.reject(errMsg);
          }
        }
      }

      // Handle events (op 5) — log but don't process
      if (msg.op === 5) {
        log(`OBS event: ${JSON.stringify(msg.d?.eventType || "unknown")}`);
      }
    } catch (err) {
      logError("Failed to parse OBS message:", err);
    }
  };

  ws.onclose = (event: CloseEvent) => {
    log(
      `OBS WebSocket closed for bridge ${bridgeId} (code=${event.code}, reason=${event.reason || "none"})`
    );
    bridgeSessions.delete(bridgeId);
  };

  ws.onerror = (event: Event) => {
    logError(`OBS WebSocket error for bridge ${bridgeId}:`, event);
  };
}

// ─── OBS Connection ──────────────────────────────────────────────────────────

function connectToObs(
  host: string,
  port: number,
  password: string
): Promise<{ bridgeId: string; obsVersion: string }> {
  return new Promise((resolve, reject) => {
    const bridgeId = randomUUID();
    const url = `ws://${host}:${port}`;
    log(`Connecting to OBS at ${url}...`);

    let ws: WebSocket;
    try {
      ws = new WebSocket(url);
    } catch (err) {
      reject(`Failed to create WebSocket: ${err}`);
      return;
    }

    // Timeout for the overall connection + handshake
    const connectTimer = setTimeout(() => {
      logError("Connection/handshake timed out");
      ws.close();
      reject("Connection to OBS timed out");
    }, RPC_TIMEOUT_MS);

    ws.onopen = () => {
      log("WebSocket opened, waiting for Hello...");
      // The Hello message handler will be set below
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string) as ObsMessage;

        // Step 1: Handle Hello (op 0)
        if (msg.op === 0) {
          const hello = msg as unknown as HelloMessage;
          log(
            `Received Hello from OBS (rpcVersion=${hello.d.rpcVersion})`
          );

          const identifyPayload: Record<string, unknown> = {
            rpcVersion: 1,
          };

          // Step 2: Authentication if required
          if (hello.d.authentication) {
            log("Authentication required, computing auth response...");
            const { challenge, salt } = hello.d.authentication;
            const secret = createHash("sha256")
              .update(password + salt)
              .digest("base64");
            const authResponse = createHash("sha256")
              .update(secret + challenge)
              .digest("base64");
            identifyPayload.authentication = authResponse;
          }

          // Step 3: Send Identify (op 1)
          log("Sending Identify...");
          ws.send(JSON.stringify({ op: 1, d: identifyPayload }));
          return;
        }

        // Step 4: Handle Identified (op 2)
        if (msg.op === 2) {
          clearTimeout(connectTimer);
          const identified = msg as unknown as IdentifiedMessage;
          log(
            `Identified with OBS (negotiatedRpcVersion=${identified.d.negotiatedRpcVersion})`
          );

          const session: BridgeSession = {
            ws,
            rpcVersion: identified.d.negotiatedRpcVersion,
          };
          bridgeSessions.set(bridgeId, session);

          // Set up the long-running message handler for RPC responses
          setupObsMessageHandler(bridgeId, ws);

          resolve({
            bridgeId,
            obsVersion: `OBS WebSocket v5 (rpcVersion=${identified.d.negotiatedRpcVersion})`,
          });
          return;
        }

        // Handle RPC responses during handshake (unlikely but safe)
        if (msg.op === 7 && msg.d) {
          const resp = msg.d as unknown as RequestResponseMessage["d"];
          const pending = pendingRequests.get(resp.requestId);
          if (pending) {
            clearTimeout(pending.timer);
            pendingRequests.delete(resp.requestId);
            if (resp.requestStatus?.result) {
              pending.resolve(resp.responseData || {});
            } else {
              pending.reject(
                resp.requestStatus?.comment ||
                  `OBS error code ${resp.requestStatus?.code}`
              );
            }
          }
        }
      } catch (err) {
        logError("Failed to parse message during handshake:", err);
      }
    };

    ws.onclose = (event: CloseEvent) => {
      clearTimeout(connectTimer);
      logError(
        `OBS WebSocket closed during handshake (code=${event.code}, reason=${event.reason || "none"})`
      );
      reject(
        `Connection closed during handshake: code=${event.code}` +
          (event.reason ? `, reason=${event.reason}` : "")
      );
    };

    ws.onerror = () => {
      clearTimeout(connectTimer);
      reject(
        "Failed to connect to OBS. Make sure OBS Studio is running and the WebSocket server is enabled in OBS Settings → Network."
      );
    };
  });
}

// ─── OBS Auto-Detect ─────────────────────────────────────────────────────────

async function detectObs(): Promise<{
  found: boolean;
  host: string;
  port: number;
}> {
  const ports = [4455, 4456];
  const host = "localhost";

  for (const port of ports) {
    try {
      const result = await tryDetectObs(host, port);
      if (result) {
        return { found: true, host, port };
      }
    } catch {
      // Continue to next port
    }
  }

  return { found: false, host, port: 4455 };
}

function tryDetectObs(host: string, port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const url = `ws://${host}:${port}`;
    const timer = setTimeout(() => {
      ws.close();
      reject("timeout");
    }, 2000);

    const ws = new WebSocket(url);

    ws.onopen = () => {
      // OBS sends Hello immediately on open, but just getting open is enough
      // to know OBS is running on this port
      clearTimeout(timer);
      log(`Detected OBS at ${url}`);
      ws.close();
      resolve(true);
    };

    ws.onerror = () => {
      clearTimeout(timer);
      reject("connection refused");
    };

    ws.onclose = () => {
      clearTimeout(timer);
      reject("closed");
    };
  });
}

// ─── Route Handlers ──────────────────────────────────────────────────────────

async function handleConnect(req: Request): Promise<Response> {
  try {
    const body = await readBody(req);
    const host = (body.host as string) || "localhost";
    const port = (body.port as number) || 4455;
    const password = (body.password as string) || "";

    const result = await connectToObs(host, port, password);
    return jsonResponse({
      success: true,
      bridgeId: result.bridgeId,
      obsVersion: result.obsVersion,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("Connect error:", message);
    return jsonResponse({ success: false, error: message }, 400);
  }
}

async function handleDisconnect(req: Request): Promise<Response> {
  try {
    const body = await readBody(req);
    const bridgeId = body.bridgeId as string;

    if (!bridgeId) {
      return jsonResponse({ success: false, error: "Missing bridgeId" }, 400);
    }

    const session = bridgeSessions.get(bridgeId);
    if (session) {
      log(`Disconnecting bridge ${bridgeId}`);
      session.ws.close();
      bridgeSessions.delete(bridgeId);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ success: false, error: "Bridge session not found" }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("Disconnect error:", message);
    return jsonResponse({ success: false, error: message }, 500);
  }
}

async function handleAddSource(req: Request): Promise<Response> {
  try {
    const body = await readBody(req);
    const bridgeId = body.bridgeId as string;
    const url = body.url as string;
    const sourceName = body.sourceName as string;
    const width = (body.width as number) || 1920;
    const height = (body.height as number) || 1080;
    let sceneName = body.sceneName as string | undefined;

    if (!bridgeId || !url || !sourceName) {
      return jsonResponse(
        { success: false, error: "Missing required fields: bridgeId, url, sourceName" },
        400
      );
    }

    const session = bridgeSessions.get(bridgeId);
    if (!session || session.ws.readyState !== WebSocket.OPEN) {
      return jsonResponse(
        { success: false, error: "OBS connection not established" },
        400
      );
    }

    // If no sceneName provided, get the current program scene
    if (!sceneName) {
      log("No sceneName provided, fetching scene list...");
      const sceneListResp = (await sendObsRequest(bridgeId, "GetSceneList", {})) as {
        currentProgramSceneName?: string;
      };
      sceneName = sceneListResp.currentProgramSceneName;
      if (!sceneName) {
        return jsonResponse(
          { success: false, error: "Could not determine current scene from OBS" },
          400
        );
      }
      log(`Using current program scene: ${sceneName}`);
    }

    const createInputData = {
      sceneName,
      inputName: sourceName,
      inputKind: "browser_source",
      sceneItemEnabled: true,
      inputSettings: {
        url,
        width,
        height,
        fps: 30,
        css: "body { background: transparent; margin: 0; }",
      },
    };

    await sendObsRequest(bridgeId, "CreateInput", createInputData);
    log(`Created browser source '${sourceName}' in scene '${sceneName}'`);

    return jsonResponse({ success: true, sourceName, sceneName });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("AddSource error:", message);
    return jsonResponse({ success: false, error: message }, 400);
  }
}

async function handleRemoveSource(req: Request): Promise<Response> {
  try {
    const body = await readBody(req);
    const bridgeId = body.bridgeId as string;
    const sourceName = body.sourceName as string;
    const sceneName = body.sceneName as string | undefined;

    if (!bridgeId || !sourceName) {
      return jsonResponse(
        { success: false, error: "Missing required fields: bridgeId, sourceName" },
        400
      );
    }

    const removeInputData: Record<string, unknown> = {
      inputName: sourceName,
    };
    if (sceneName) {
      removeInputData.sceneName = sceneName;
    }

    await sendObsRequest(bridgeId, "RemoveInput", removeInputData);
    log(`Removed source '${sourceName}'`);

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("RemoveSource error:", message);
    return jsonResponse({ success: false, error: message }, 400);
  }
}

async function handleSetSourceUrl(req: Request): Promise<Response> {
  try {
    const body = await readBody(req);
    const bridgeId = body.bridgeId as string;
    const sourceName = body.sourceName as string;
    const url = body.url as string;

    if (!bridgeId || !sourceName || !url) {
      return jsonResponse(
        { success: false, error: "Missing required fields: bridgeId, sourceName, url" },
        400
      );
    }

    await sendObsRequest(bridgeId, "SetInputSettings", {
      inputName: sourceName,
      inputSettings: { url },
    });
    log(`Updated URL for source '${sourceName}'`);

    return jsonResponse({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("SetSourceUrl error:", message);
    return jsonResponse({ success: false, error: message }, 400);
  }
}

function handleStatus(url: URL): Response {
  const bridgeId = url.searchParams.get("bridgeId");

  if (!bridgeId) {
    return jsonResponse(
      { success: false, error: "Missing bridgeId query parameter" },
      400
    );
  }

  const session = bridgeSessions.get(bridgeId);
  const connected = !!session && session.ws.readyState === WebSocket.OPEN;

  return jsonResponse({
    success: true,
    connected,
    ...(connected && session?.obsVersion ? { obsVersion: session.obsVersion } : {}),
  });
}

async function handleDetect(): Promise<Response> {
  try {
    const result = await detectObs();
    return jsonResponse({ success: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logError("Detect error:", message);
    return jsonResponse({ success: true, found: false, host: "localhost", port: 4455 });
  }
}

// ─── HTTP Server ─────────────────────────────────────────────────────────────

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;
  const method = req.method;

  // CORS preflight
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // Route matching
  try {
    // POST /api/connect
    if (pathname === "/api/connect" && method === "POST") {
      return await handleConnect(req);
    }

    // POST /api/disconnect
    if (pathname === "/api/disconnect" && method === "POST") {
      return await handleDisconnect(req);
    }

    // POST /api/add-source
    if (pathname === "/api/add-source" && method === "POST") {
      return await handleAddSource(req);
    }

    // POST /api/remove-source
    if (pathname === "/api/remove-source" && method === "POST") {
      return await handleRemoveSource(req);
    }

    // POST /api/set-source-url
    if (pathname === "/api/set-source-url" && method === "POST") {
      return await handleSetSourceUrl(req);
    }

    // GET /api/status
    if (pathname === "/api/status" && method === "GET") {
      return handleStatus(url);
    }

    // GET /api/detect
    if (pathname === "/api/detect" && method === "GET") {
      return await handleDetect();
    }

    // 404
    return jsonResponse(
      { success: false, error: `Not found: ${method} ${pathname}` },
      404
    );
  } catch (err) {
    logError("Unhandled error:", err);
    return jsonResponse(
      { success: false, error: "Internal server error" },
      500
    );
  }
}

// ─── Start Server ────────────────────────────────────────────────────────────

const server = Bun.serve({
  port: 3005,
  fetch: handler,
});

log(`OBS Bridge server listening on port ${server.port}`);

// Graceful shutdown
function shutdown() {
  log("Shutting down...");
  for (const [bridgeId, session] of bridgeSessions) {
    log(`Closing OBS connection for bridge ${bridgeId}`);
    session.ws.close();
  }
  bridgeSessions.clear();
  for (const [reqId, pending] of pendingRequests) {
    clearTimeout(pending.timer);
    pending.reject("Server shutting down");
  }
  pendingRequests.clear();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
