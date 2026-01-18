// Message reactions endpoint
import { type NextRequest, NextResponse } from "next/server"
import type { ApiResponse } from "@/lib/types"

interface MessageReaction {
  messageId: string
  userId: string
  emoji: string
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<MessageReaction>>> {
  try {
    const payload = await request.json()

    // In a production app, you'd want to persist reactions in the database
    // For now, we're just acknowledging the reaction for real-time broadcast

    return NextResponse.json({
      success: true,
      data: {
        messageId: payload.messageId,
        userId: payload.userId,
        emoji: payload.emoji,
      },
    })
  } catch (error) {
    console.error("[v0] Reaction error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process reaction",
      },
      { status: 500 },
    )
  }
}
