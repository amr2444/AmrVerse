// Get and manage room participants
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, RoomParticipant } from "@/lib/types"

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<RoomParticipant[]>>> {
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

    const participants = await sql(
      `SELECT rp.id, rp.room_id, rp.user_id, rp.joined_at, rp.last_seen, u.username, u.display_name
       FROM room_participants rp
       JOIN users u ON rp.user_id = u.id
       WHERE rp.room_id = $1
       ORDER BY rp.joined_at DESC`,
      [roomId],
    )

    return NextResponse.json({
      success: true,
      data: participants.map((p: any) => ({
        id: p.id,
        roomId: p.room_id,
        userId: p.user_id,
        username: p.display_name || p.username,
        joinedAt: p.joined_at,
        lastSeen: p.last_seen,
      })),
    })
  } catch (error) {
    console.error("[v0] Get participants error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch participants",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<RoomParticipant>>> {
  try {
    const payload = await request.json()

    const [participant] = await sql(
      `INSERT INTO room_participants (room_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (room_id, user_id) DO UPDATE SET last_seen = NOW()
       RETURNING id, room_id, user_id, joined_at, last_seen`,
      [payload.roomId, payload.userId],
    )

    return NextResponse.json({
      success: true,
      data: {
        id: participant.id,
        roomId: participant.room_id,
        userId: participant.user_id,
        joinedAt: participant.joined_at,
        lastSeen: participant.last_seen,
      },
    })
  } catch (error) {
    console.error("[v0] Add participant error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add participant",
      },
      { status: 500 },
    )
  }
}
