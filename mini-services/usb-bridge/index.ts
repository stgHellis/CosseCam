import { createServer } from 'http'

/**
 * CosseCam USB Bridge Service (port 3006)
 *
 * Detects USB-tethered Android devices by probing known USB tethering
 * IP ranges. When USB tethering is active on the phone, the phone gets
 * an IP in the 192.168.42.x or 192.168.43.x range.
 *
 * Also provides a WebSocket endpoint for real-time USB status updates.
 */

const PORT = 3006

// Known Android USB tethering IP ranges
const USB_TETHERING_RANGES = [
  { base: '192.168.42', start: 1, end: 255 },
  { base: '192.168.43', start: 1, end: 255 },
]

// Cache of detected devices
const detectedDevices = new Map<string, { ip: string; lastSeen: number; rtt: number }>()
const CACHE_TTL = 30_000 // 30 seconds

const clients = new Set<{ send: (data: string) => void }>()

/** Probe a single IP:port with a timeout */
function probeHost(ip: string, port: number, timeoutMs: number = 800): Promise<{ ip: string; rtt: number } | null> {
  return new Promise((resolve) => {
    const start = performance.now()
    const controller = new AbortController()
    const timer = setTimeout(() => {
      controller.abort()
      resolve(null)
    }, timeoutMs)

    fetch(`http://${ip}:${port}/`, {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors',
    })
      .then(() => {
        clearTimeout(timer)
        const rtt = Math.round(performance.now() - start)
        resolve({ ip, rtt })
      })
      .catch(() => {
        clearTimeout(timer)
        resolve(null)
      })
  })
}

/** Probe USB tethering IP ranges for responsive hosts */
async function detectUsbTethering(): Promise<Array<{ ip: string; rtt: number }>> {
  const results: Array<{ ip: string; rtt: number }> = []

  // Batch-probe with concurrency limit
  const CONCURRENCY = 16
  const probes: Array<Promise<{ ip: string; rtt: number } | null>> = []

  for (const range of USB_TETHERING_RANGES) {
    for (let i = range.start; i <= range.end; i++) {
      const ip = `${range.base}.${i}`
      probes.push(probeHost(ip, 3000)) // Probe Next.js default port
      probes.push(probeHost(ip, 80)) // Probe common HTTP port

      // Throttle: when we hit concurrency limit, wait for some to finish
      if (probes.length >= CONCURRENCY * 2) {
        const batch = probes.splice(0, CONCURRENCY * 2)
        const batchResults = await Promise.all(batch)
        for (const r of batchResults) {
          if (r) results.push(r)
        }
      }
    }
  }

  // Wait for remaining probes
  const remaining = await Promise.all(probes)
  for (const r of remaining) {
    if (r) results.push(r)
  }

  // Update cache
  const now = Date.now()
  for (const r of results) {
    detectedDevices.set(r.ip, { ip: r.ip, lastSeen: now, rtt: r.rtt })
  }

  // Clean old entries
  for (const [key, val] of detectedDevices) {
    if (now - val.lastSeen > CACHE_TTL) {
      detectedDevices.delete(key)
    }
  }

  return results
}

// HTTP Server
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // Health check
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', service: 'cossecam-usb-bridge' }))
    return
  }

  // Detect USB tethering
  if (url.pathname === '/api/detect' && req.method === 'GET') {
    console.log('[USB-Bridge] Starting USB tethering detection...')
    const devices = await detectUsbTethering()
    console.log(`[USB-Bridge] Detection complete. Found ${devices.length} device(s)`)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      detected: devices.length > 0,
      devices: devices.map((d) => ({ ip: d.ip, rtt: d.rtt })),
      cachedDevices: Array.from(detectedDevices.values()),
    }))
    return
  }

  // Get cached status (fast, no probing)
  if (url.pathname === '/api/status' && req.method === 'GET') {
    const now = Date.now()
    const active = Array.from(detectedDevices.values()).filter(
      (d) => now - d.lastSeen < CACHE_TTL
    )
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      usbTetheringActive: active.length > 0,
      devices: active.map((d) => ({ ip: d.ip, rtt: d.rtt })),
    }))
    return
  }

  // Probe a specific IP
  if (url.pathname === '/api/probe' && req.method === 'GET') {
    const targetIp = url.searchParams.get('ip')
    const targetPort = parseInt(url.searchParams.get('port') || '3000', 10)
    if (!targetIp) {
      res.writeHead(400, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Missing ip parameter' }))
      return
    }
    const result = await probeHost(targetIp, targetPort, 2000)
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({
      reachable: result !== null,
      ip: targetIp,
      rtt: result?.rtt || null,
    }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'Not found' }))
})

// WebSocket upgrade for real-time status
server.on('upgrade', (req, socket) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`)
  if (url.pathname !== '/ws') {
    socket.destroy()
    return
  }

  console.log('[USB-Bridge] WebSocket client connected')

  const client = {
    send: (data: string) => {
      try {
        socket.write(data)
      } catch {
        clients.delete(client)
      }
    },
  }
  clients.add(client)

  // Send current status on connect
  const now = Date.now()
  const active = Array.from(detectedDevices.values()).filter(
    (d) => now - d.lastSeen < CACHE_TTL
  )
  client.send(JSON.stringify({
    type: 'status',
    usbTetheringActive: active.length > 0,
    devices: active,
  }))

  socket.on('close', () => {
    clients.delete(client)
    console.log('[USB-Bridge] WebSocket client disconnected')
  })

  socket.on('error', () => {
    clients.delete(client)
  })
})

// Periodic status broadcast to WebSocket clients
setInterval(() => {
  if (clients.size === 0) return
  const now = Date.now()
  const active = Array.from(detectedDevices.values()).filter(
    (d) => now - d.lastSeen < CACHE_TTL
  )
  const msg = JSON.stringify({
    type: 'status',
    usbTetheringActive: active.length > 0,
    devices: active,
  })
  for (const client of clients) {
    client.send(msg)
  }
}, 5000)

server.listen(PORT, () => {
  console.log(`[USB-Bridge] USB Bridge service running on port ${PORT}`)
  console.log(`[USB-Bridge] Endpoints:`)
  console.log(`  GET /api/health   — Health check`)
  console.log(`  GET /api/status   — Cached USB status (fast)`)
  console.log(`  GET /api/detect   — Probe USB tethering IPs (slow, 3-5s)`)
  console.log(`  GET /api/probe?ip=x.x.x.x&port=3000 — Probe specific IP`)
  console.log(`  WS  /ws           — Real-time USB status updates`)
})

process.on('SIGTERM', () => {
  console.log('[USB-Bridge] Shutting down...')
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('[USB-Bridge] Shutting down...')
  server.close(() => process.exit(0))
})
