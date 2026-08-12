/**
 * Shared camera stream reference.
 * Allows any module to access the current MediaStream
 * without scraping the DOM.
 */
let currentStream: MediaStream | null = null

export const cameraStream = {
  get: () => currentStream,
  set: (stream: MediaStream | null) => {
    currentStream = stream
  },
}
