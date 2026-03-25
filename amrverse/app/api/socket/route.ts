// WebSocket endpoint handler
import type { NextRequest } from "next/server"

export function POST(request: NextRequest) {
  return new Response("Socket.IO endpoint", { status: 200 })
}
