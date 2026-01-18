// WebSocket endpoint handler
import type { NextRequest } from "next/server"
import type { Server } from "socket.io"
import { initializeSocketHandlers } from "@/lib/socket-handler"

// Global IO instance
let io: InstanceType<typeof Server> | null = null

export function POST(request: NextRequest) {
  if (!io) {
    // This would typically be set up in a custom Next.js server
    // For v0 and Vercel, Socket.IO needs special setup
    console.error("[v0] Socket.IO not properly initialized")
  }

  return new Response("Socket.IO endpoint", { status: 200 })
}

// Export for server-side initialization
export function initSocket(ioInstance: InstanceType<typeof Server>) {
  io = ioInstance
  initializeSocketHandlers(io)
}
