// Save and retrieve chat messages - SECURED: userId extracted from JWT token
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserIdFromToken } from "@/lib/auth"
import { sanitizeInput } from "@/lib/validations"
import type { ApiResponse, ChatMessage } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ChatMessage>>> {
  try {
    // SECURITY FIX: Require authentication
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    // SECURITY FIX: Extract userId from JWT token instead of request body
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 },
      )
    }

    const payload = await request.json()

    if (!payload.roomId || !payload.message) {
      return NextResponse.json(
        { success: false, error: "roomId and message are required" },
        { status: 400 },
      )
    }

    // Validate message length
    if (payload.message.length > 2000) {
      return NextResponse.json(
        { success: false, error: "Message too long (max 2000 characters)" },
        { status: 400 },
      )
    }

    // Sanitize message content to prevent XSS
    const sanitizedMessage = sanitizeInput(payload.message)

    const [message] = await sql(
      `INSERT INTO chat_messages (room_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, user_id, message, created_at`,
      [payload.roomId, userId, sanitizedMessage],
    )

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        roomId: message.room_id,
        userId: message.user_id,
        message: message.message,
        createdAt: message.created_at,
      },
    })
  } catch (error) {
    console.error("[v0] Save message error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save message",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ChatMessage[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json(
        {
          success: false,
          error: "roomId is required",
        },
        { status: 400 },
      )
    }

    // Include lightweight author info for the UI (no extra lookup needed on the client)
    const messages = await sql(
      `SELECT cm.id, cm.room_id, cm.user_id, cm.message, cm.created_at,
              u.username, u.display_name
       FROM chat_messages cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.room_id = $1
       ORDER BY cm.created_at ASC
       LIMIT 200`,
      [roomId],
    )

    return NextResponse.json({
      success: true,
      data: messages.map((m: any) => ({
        id: m.id,
        roomId: m.room_id,
        userId: m.user_id,
        username: m.display_name || m.username,
        message: m.message,
        createdAt: m.created_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Get messages error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch messages",
      },
      { status: 500 },
    )
  }
}
