// Client-side Socket.IO utilities - SECURED with JWT authentication
"use client"

import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

/**
 * Get the current auth token from localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("amrverse_token")
}

/**
 * Initialize socket connection with JWT authentication
 * The token is sent during the handshake for server-side verification
 */
export function initializeSocket(): Socket {
  // If socket exists and is connected, return it
  if (socket?.connected) {
    return socket
  }

  // Disconnect existing socket if it exists but isn't connected
  if (socket) {
    socket.disconnect()
    socket = null
  }

  const token = getAuthToken()
  
  if (!token) {
    console.warn("[Socket] No auth token available - socket connection may fail")
  }

  socket = io(undefined, {
    path: "/api/socket",
    addTrailingSlash: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    // SECURITY FIX: Send JWT token for authentication
    auth: {
      token: token,
    },
  })

  socket.on("connect", () => {
    console.log("[v0] Socket connected (authenticated):", socket?.id)
  })

  socket.on("connect_error", (error) => {
    console.error("[v0] Socket connection error:", error.message)
    // If authentication fails, the token might be expired
    if (error.message.includes("token") || error.message.includes("Authentication")) {
      console.warn("[Socket] Authentication failed - user may need to re-login")
    }
  })

  socket.on("disconnect", (reason) => {
    console.log("[v0] Socket disconnected:", reason)
  })

  socket.on("error", (error: { message: string }) => {
    console.error("[v0] Socket error:", error.message)
  })

  return socket
}

/**
 * Reinitialize socket with fresh token (call after login/token refresh)
 */
export function reconnectSocket(): Socket {
  closeSocket()
  return initializeSocket()
}

export function getSocket(): Socket | null {
  return socket
}

export function closeSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Check if socket is connected and authenticated
 */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false
}
