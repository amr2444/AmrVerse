// Save and retrieve chat messages
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, ChatMessage } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ChatMessage>>> {
  try {
    const payload = await request.json()

    const [message] = await sql(
      `INSERT INTO chat_messages (room_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, user_id, message, created_at`,
      [payload.roomId, payload.userId, payload.message],
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
