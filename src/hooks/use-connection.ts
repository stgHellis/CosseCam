"use client"

import { useCallback, useEffect, useRef } from "react"
import { io, Socket } from "socket.io-client"
import { useCosseCamStore } from "@/store/cossecam-store"
import { cameraStream } from "@/lib/camera-stream"

function setupPeerConnection(
  socket: Socket,
  targetPeerId: string,
  pcRef: React.MutableRefObject<RTCPeerConnection | null>,
  setConnectionState: (s: "disconnected" | "connecting" | "connected") => void
): RTCPeerConnection {
  const config: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  }

  if (pcRef.current) {
    pcRef.current.close()
  }

  const pc = new RTCPeerConnection(config)
  pcRef.current = pc

  // Bug #3 fix: use shared stream reference instead of DOM query
  const stream = cameraStream.get()
  if (stream) {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream)
    })
  }

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        targetId: targetPeerId,
        candidate: event.candidate,
      })
    }
  }

  pc.oniceconnectionstatechange = () => {
    const state = pc.iceConnectionState
    console.log(`[CosseCam] ICE state: ${state}`)
    if (state === "connected" || state === "completed") {
      setConnectionState("connected")
    } else if (state === "disconnected" || state === "failed") {
      setConnectionState("disconnected")
    }
  }

  if (stream) {
    pc.createOffer()
      .then((offer) => pc.setLocalDescription(offer))
      .then(() => {
        socket.emit("signal", {
          targetId: targetPeerId,
          signal: pc.localDescription,
        })
      })
      .catch(console.error)
  }

  return pc
}

export function useConnection() {
  const socketRef = useRef<Socket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const latencyIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    sessionId,
    setConnectionState,
    setPeerCount,
    setLatency,
    isCameraActive,
  } = useCosseCamStore()

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return

    const socket = io("/?XTransformPort=3004", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })

    socket.on("connect", () => {
      console.log("[CosseCam] Connected to signaling server")
      socket.emit("join-session", {
        sessionId,
        type: "camera",
      })
    })

    socket.on("session-peers", ({ peers }) => {
      setPeerCount(peers.length)
      setConnectionState(peers.length > 0 ? "connected" : "connecting")
    })

    socket.on("peer-joined", ({ peerId, type }) => {
      console.log(`[CosseCam] Peer joined: ${peerId} (${type})`)
      const state = useCosseCamStore.getState()
      const count = state.peerCount + 1
      setPeerCount(count)

      if (type === "viewer" && isCameraActive) {
        setupPeerConnection(socket, peerId, pcRef, setConnectionState)
      }
    })

    socket.on("peer-left", () => {
      const state = useCosseCamStore.getState()
      const newCount = Math.max(0, state.peerCount - 1)
      setPeerCount(newCount)
      if (newCount === 0) {
        setConnectionState("connecting")
      }
    })

    socket.on("signal", async ({ fromId, signal }) => {
      if (!pcRef.current) {
        setupPeerConnection(socket, fromId, pcRef, setConnectionState)
      }
      try {
        if (signal.type === "offer") {
          await pcRef.current?.setRemoteDescription(new RTCSessionDescription(signal))
          const answer = await pcRef.current?.createAnswer()
          await pcRef.current?.setLocalDescription(answer)
          socket.emit("signal", { targetId: fromId, signal: answer })
        } else if (signal.type === "answer") {
          await pcRef.current?.setRemoteDescription(new RTCSessionDescription(signal))
        }
      } catch (err) {
        console.error("[CosseCam] Signal error:", err)
      }
    })

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        await pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (err) {
        console.error("[CosseCam] ICE candidate error:", err)
      }
    })

    socket.on("connect_error", () => {
      setConnectionState("disconnected")
    })

    socket.on("disconnect", () => {
      setConnectionState("disconnected")
    })

    socketRef.current = socket
  }, [sessionId, setConnectionState, setPeerCount, isCameraActive])

  const disconnect = useCallback(() => {
    if (latencyIntervalRef.current) {
      clearInterval(latencyIntervalRef.current)
      latencyIntervalRef.current = null
    }
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setConnectionState("disconnected")
    setPeerCount(0)
    setLatency(0)
  }, [setConnectionState, setPeerCount, setLatency])

  const measureLatency = useCallback(() => {
    if (latencyIntervalRef.current) {
      clearInterval(latencyIntervalRef.current)
    }

    latencyIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const start = Date.now()
        socketRef.current.emit("ping-measure", { timestamp: start })
      }
    }, 3000)

    if (socketRef.current) {
      socketRef.current.off("pong-measure")
      socketRef.current.on(
        "pong-measure",
        (data: { timestamp: number; serverTimestamp: number }) => {
          const latency = Date.now() - data.timestamp
          setLatency(latency)
        }
      )
    }
  }, [setLatency])

  useEffect(() => {
    return () => {
      if (latencyIntervalRef.current) clearInterval(latencyIntervalRef.current)
      if (pcRef.current) pcRef.current.close()
      if (socketRef.current) socketRef.current.disconnect()
    }
  }, [])

  return {
    connect,
    disconnect,
    measureLatency,
    socketRef,
    pcRef,
  }
}
