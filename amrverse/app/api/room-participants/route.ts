// Get and manage room participants
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAuthenticatedUserId } from "@/lib/auth-request"
import type { ApiResponse, RoomParticipant } from "@/lib/types"

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<RoomParticipant[]>>> {
  try {
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

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

    const [membership] = await sql(
      `SELECT 1
       FROM reading_rooms rr
       LEFT JOIN room_participants rp ON rr.id = rp.room_id AND rp.user_id = $2
       WHERE rr.id = $1 AND (rr.host_id = $2 OR rp.user_id = $2)
       LIMIT 1`,
      [roomId, userId],
    )

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
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
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const payload = await request.json()

    if (!payload.roomId) {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 },
      )
    }

    const [room] = await sql(
      `SELECT id, is_active, expires_at FROM reading_rooms WHERE id = $1`,
      [payload.roomId],
    )

    if (!room || !room.is_active) {
      return NextResponse.json(
        { success: false, error: "Room not found or inactive" },
        { status: 404 },
      )
    }

    const [participant] = await sql(
      `INSERT INTO room_participants (room_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT (room_id, user_id) DO UPDATE SET last_seen = NOW()
       RETURNING id, room_id, user_id, joined_at, last_seen`,
      [payload.roomId, userId],
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
