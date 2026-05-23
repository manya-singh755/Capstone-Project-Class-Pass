/*  CLASS-PASS — Socket.IO Hook  */
import { useEffect, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'

const SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000'
  : window.location.origin

let sharedSocket = null
let refCount = 0

function getSocket() {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
    })
  }
  refCount++
  return sharedSocket
}

function releaseSocket() {
  refCount--
  if (refCount <= 0 && sharedSocket) {
    sharedSocket.disconnect()
    sharedSocket = null
    refCount = 0
  }
}

export function useSocket(eventHandlers = {}) {
  const socketRef = useRef(null)
  const handlersRef = useRef(eventHandlers)
  handlersRef.current = eventHandlers

  useEffect(() => {
    const socket = getSocket()
    socketRef.current = socket

    // Register event handlers
    const events = Object.keys(handlersRef.current)
    for (const event of events) {
      socket.on(event, handlersRef.current[event])
    }

    return () => {
      for (const event of events) {
        socket.off(event, handlersRef.current[event])
      }
      releaseSocket()
    }
  }, [])

  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data)
  }, [])

  return { emit, socket: socketRef }
}
