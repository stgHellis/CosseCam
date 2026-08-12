"use client"

import { useEffect, useRef } from "react"
import { useCosseCamStore } from "@/store/cossecam-store"
import { useConnection } from "@/hooks/use-connection"

/**
 * Reads ?session=xxx&role=viewer from the URL and auto-joins
 * the camera session as a viewer when the page is opened via QR scan.
 */
export function useQRConnect() {
  const processed = useRef(false)
  const {
    sessionId,
    setSessionId,
    setView,
    setConnectionState,
    connectionState,
  } = useCosseCamStore()
  const { connect } = useConnection()

  useEffect(() => {
    if (processed.current) return
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const sessionParam = params.get("session")
    const roleParam = params.get("role")

    // Only act if both params are present and role is "viewer"
    if (!sessionParam || roleParam !== "viewer") return

    processed.current = true

    // Set the session ID from the QR code
    setSessionId(sessionParam)

    // Clean up URL without reload
    const cleanUrl = window.location.origin + window.location.pathname
    window.history.replaceState({}, "", cleanUrl)

    // Switch to camera view as viewer
    setView("camera")
    setConnectionState("connecting")

    // Give the store a tick to update, then connect
    const timer = setTimeout(() => {
      connect()
    }, 500)

    return () => clearTimeout(timer)
  }, [sessionId, setSessionId, setView, setConnectionState, connect])
}
