// Create and list reading rooms - SECURED: userId extracted from JWT token
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { generateRoomCode, getUserIdFromToken } from "@/lib/auth"
import type { ApiResponse, ReadingRoom } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ReadingRoom>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    // SECURITY FIX: Extract hostId from JWT token instead of request body
    const hostId = getUserIdFromToken(token)
    if (!hostId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 },
      )
    }

    const payload = await request.json()
    const code = generateRoomCode()

    const [newRoom] = await sql(
      `INSERT INTO reading_rooms (code, manhwa_id, chapter_id, host_id, room_name, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, manhwa_id, chapter_id, host_id, room_name, current_scroll_position, is_active, max_participants, created_at, expires_at`,
      [code, payload.manhwaId, payload.chapterId, hostId, payload.roomName, payload.maxParticipants || 10],
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newRoom.id,
          code: newRoom.code,
          manhwaId: newRoom.manhwa_id,
          chapterId: newRoom.chapter_id,
          hostId: newRoom.host_id,
          roomName: newRoom.room_name,
          currentScrollPosition: newRoom.current_scroll_position || 0,
          currentPageIndex: 0,
          isActive: newRoom.is_active,
          maxParticipants: newRoom.max_participants,
          syncEnabled: true,
          createdAt: newRoom.created_at,
          expiresAt: newRoom.expires_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create room error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create room",
      },
      { status: 500 },
    )
  }
}

// Update room scroll position (for sync mode)
export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<ReadingRoom>>> {
  try {
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
    const { roomId, scrollPosition, currentPageIndex } = payload

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 },
      )
    }

    // Verify the user is the host
    const [room] = await sql(
      `SELECT id, host_id FROM reading_rooms WHERE id = $1`,
      [roomId]
    )

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 },
      )
    }

    // SECURITY FIX: Compare against token userId, not payload hostId
    if (room.host_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Only the host can update scroll position" },
        { status: 403 },
      )
    }

    // Update scroll position and page index
    const [updatedRoom] = await sql(
      `UPDATE reading_rooms 
       SET current_scroll_position = $1, current_page_index = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, code, manhwa_id, chapter_id, host_id, room_name, current_scroll_position, current_page_index, sync_enabled, is_active, max_participants, created_at, expires_at`,
      [scrollPosition || 0, currentPageIndex || 0, roomId],
    )

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRoom.id,
        code: updatedRoom.code,
        manhwaId: updatedRoom.manhwa_id,
        chapterId: updatedRoom.chapter_id,
        hostId: updatedRoom.host_id,
        roomName: updatedRoom.room_name,
        currentScrollPosition: updatedRoom.current_scroll_position || 0,
        currentPageIndex: updatedRoom.current_page_index || 0,
        isActive: updatedRoom.is_active,
        maxParticipants: updatedRoom.max_participants,
        syncEnabled: updatedRoom.sync_enabled !== false,
        createdAt: updatedRoom.created_at,
        expiresAt: updatedRoom.expires_at,
      },
    })
  } catch (error) {
    console.error("[v0] Update room scroll error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update room" },
      { status: 500 },
    )
  }
}

// Delete a reading room (host only)
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    // SECURITY FIX: Extract userId from JWT token instead of query params
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 },
      )
    }

    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId is required" },
        { status: 400 },
      )
    }

    // Verify the room exists and user is the host
    const [room] = await sql(
      `SELECT id, host_id FROM reading_rooms WHERE id = $1`,
      [roomId]
    )

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 },
      )
    }

    // SECURITY FIX: Compare against token userId, not query param hostId
    if (room.host_id !== userId) {
      return NextResponse.json(
        { success: false, error: "Only the host can delete this room" },
        { status: 403 },
      )
    }

    // Delete the room (CASCADE will handle related records: participants, messages, panel_comments)
    await sql(
      `DELETE FROM reading_rooms WHERE id = $1`,
      [roomId]
    )

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error("[v0] Delete room error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete room" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ReadingRoom[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")

    if (code) {
      // Get specific room by code
      const [room] = await sql(
        `SELECT id, code, manhwa_id, chapter_id, host_id, room_name, current_scroll_position,
                current_page_index, sync_enabled, is_active, max_participants, created_at, updated_at, expires_at
         FROM reading_rooms WHERE code = $1`,
        [code],
      )

      if (!room) {
        return NextResponse.json(
          {
            success: false,
            error: "Room not found",
          },
          { status: 404 },
        )
      }

      return NextResponse.json({
        success: true,
        data: [
          {
            id: room.id,
            code: room.code,
            manhwaId: room.manhwa_id,
            chapterId: room.chapter_id,
            hostId: room.host_id,
            roomName: room.room_name,
            currentScrollPosition: room.current_scroll_position || 0,
            currentPageIndex: room.current_page_index || 0,
            isActive: room.is_active,
            maxParticipants: room.max_participants,
            syncEnabled: room.sync_enabled !== false,
            updatedAt: room.updated_at,
            createdAt: room.created_at,
            expiresAt: room.expires_at,
          },
        ],
      })
    }

    // Get all active rooms
    const rooms = await sql(
      `SELECT id, code, manhwa_id, chapter_id, host_id, room_name, current_scroll_position,
              current_page_index, sync_enabled, is_active, max_participants, created_at, updated_at, expires_at
       FROM reading_rooms WHERE is_active = true AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 50`,
    )

    return NextResponse.json({
      success: true,
      data: rooms.map((r: any) => ({
        id: r.id,
        code: r.code,
        manhwaId: r.manhwa_id,
        chapterId: r.chapter_id,
        hostId: r.host_id,
        roomName: r.room_name,
        currentScrollPosition: r.current_scroll_position || 0,
        currentPageIndex: r.current_page_index || 0,
        isActive: r.is_active,
        maxParticipants: r.max_participants,
        syncEnabled: r.sync_enabled !== false,
        updatedAt: r.updated_at,
        createdAt: r.created_at,
        expiresAt: r.expires_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Get rooms error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch rooms",
      },
      { status: 500 },
    )
  }
}
