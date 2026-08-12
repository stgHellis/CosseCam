import { NextRequest, NextResponse } from "next/server";

//export const runtime = "edge"

// Stream endpoint for OBS Studio Browser Source
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CosseCam - ${sessionId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; width: 100vw; height: 100vh; overflow: hidden; }
    video { width: 100%; height: 100%; object-fit: contain; }
    #status {
      position: fixed; top: 8px; right: 8px;
      padding: 4px 12px; border-radius: 6px;
      font-family: monospace; font-size: 11px;
      background: rgba(0,0,0,0.7); color: #10b981;
      border: 1px solid rgba(16,185,129,0.3);
      z-index: 10;
    }
    #status.error { color: #ef4444; border-color: rgba(239,68,68,0.3); }
  </style>
</head>
<body>
  <div id="status">Connexion…</div>
  <video id="remoteVideo" autoplay playsinline></video>
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const sessionId = "${sessionId}";
    const statusEl = document.getElementById("status");
    const videoEl = document.getElementById("remoteVideo");
    let pc = null;

    const socket = io("/?XTransformPort=3004", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      socket.emit("join-session", { sessionId, type: "viewer" });
    });

    socket.on("session-peers", ({ peers }) => {
      if (peers.length > 0) {
        statusEl.textContent = peers.length + " source(s)";
      }
    });

    socket.on("signal", async ({ fromId, signal }) => {
      if (!pc) {
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
          ]
        });

        pc.ontrack = (event) => {
          videoEl.srcObject = event.streams[0];
          statusEl.textContent = "Flux actif";
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit("ice-candidate", { targetId: fromId, candidate: event.candidate });
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            statusEl.textContent = "Connecté";
          } else if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
            statusEl.textContent = "Déconnecté";
            statusEl.className = "error";
          }
        };
      }

      try {
        if (signal.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("signal", { targetId: fromId, signal: answer });
        } else if (signal.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
        }
      } catch (err) {
        statusEl.textContent = "Erreur";
        statusEl.className = "error";
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try { await pc?.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
    });

    socket.on("disconnect", () => {
      statusEl.textContent = "Signal perdu";
      statusEl.className = "error";
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
