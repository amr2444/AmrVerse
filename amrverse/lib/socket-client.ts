// Client-side Socket.IO utilities
"use client"

import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function initializeSocket(): Socket {
  if (socket) {
    return socket
  }

  socket = io(undefined, {
    path: "/api/socket",
    addTrailingSlash: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  socket.on("connect", () => {
    console.log("[v0] Socket connected:", socket?.id)
  })

  socket.on("disconnect", () => {
    console.log("[v0] Socket disconnected")
  })

  return socket
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
