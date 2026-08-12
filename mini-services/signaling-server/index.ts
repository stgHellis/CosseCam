import { createServer } from 'http'
import { Server } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

interface PeerInfo {
  id: string
  type: 'camera' | 'viewer'
  sessionId: string
  connectedAt: Date
}

const rooms = new Map<string, Set<string>>()
const peers = new Map<string, PeerInfo>()

io.on('connection', (socket) => {
  console.log(`[CosseCam] Peer connected: ${socket.id}`)

  socket.on('join-session', (data: { sessionId: string; type: 'camera' | 'viewer' }) => {
    const { sessionId, type } = data

    const peerInfo: PeerInfo = {
      id: socket.id,
      type,
      sessionId,
      connectedAt: new Date(),
    }

    peers.set(socket.id, peerInfo)

    if (!rooms.has(sessionId)) {
      rooms.set(sessionId, new Set())
    }
    rooms.get(sessionId)!.add(socket.id)

    socket.join(sessionId)

    // Notify others in the room
    socket.to(sessionId).emit('peer-joined', {
      peerId: socket.id,
      type,
      sessionId,
    })

    // Send existing peers to the new joiner
    const roomPeers = rooms.get(sessionId)!
    const existingPeers: Array<{ peerId: string; type: string }> = []
    roomPeers.forEach(peerId => {
      if (peerId !== socket.id) {
        const peer = peers.get(peerId)
        if (peer) {
          existingPeers.push({ peerId: peer.id, type: peer.type })
        }
      }
    })

    socket.emit('session-peers', { peers: existingPeers, sessionId })

    console.log(`[CosseCam] ${type} ${socket.id} joined session ${sessionId}. Room size: ${roomPeers.size}`)
  })

  // WebRTC signaling
  socket.on('signal', (data: { targetId: string; signal: unknown }) => {
    const { targetId, signal } = data
    const targetPeer = peers.get(targetId)
    if (targetPeer && targetPeer.sessionId) {
      io.to(targetId).emit('signal', {
        fromId: socket.id,
        signal,
      })
      console.log(`[CosseCam] Signal from ${socket.id} to ${targetId}`)
    }
  })

  // ICE candidate
  socket.on('ice-candidate', (data: { targetId: string; candidate: unknown }) => {
    const { targetId, candidate } = data
    io.to(targetId).emit('ice-candidate', {
      fromId: socket.id,
      candidate,
    })
  })

  // Latency measurement
  socket.on('ping-measure', (data: { timestamp: number }) => {
    socket.emit('pong-measure', {
      timestamp: data.timestamp,
      serverTimestamp: Date.now(),
    })
  })

  // Session stats
  socket.on('session-stats', (data: { sessionId: string; stats: unknown }) => {
    socket.to(data.sessionId).emit('session-stats', {
      fromId: socket.id,
      stats: data.stats,
    })
  })

  socket.on('disconnect', (reason) => {
    const peer = peers.get(socket.id)
    if (peer) {
      const room = rooms.get(peer.sessionId)
      if (room) {
        room.delete(socket.id)
        if (room.size === 0) {
          rooms.delete(peer.sessionId)
        } else {
          socket.to(peer.sessionId).emit('peer-left', {
            peerId: socket.id,
            type: peer.type,
            sessionId: peer.sessionId,
          })
        }
      }
      peers.delete(socket.id)
      console.log(`[CosseCam] ${peer.type} ${socket.id} disconnected from session ${peer.sessionId}. Reason: ${reason}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`[CosseCam] Socket error (${socket.id}):`, error)
  })
})

const PORT = 3004
httpServer.listen(PORT, () => {
  console.log(`[CosseCam] Signaling server running on port ${PORT}`)
})

process.on('SIGTERM', () => {
  console.log('[CosseCam] Shutting down signaling server...')
  httpServer.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('[CosseCam] Shutting down signaling server...')
  httpServer.close(() => process.exit(0))
})
