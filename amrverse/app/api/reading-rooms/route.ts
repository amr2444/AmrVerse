// Create and list reading rooms - SECURED: userId extracted from JWT token
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { generateRoomCode } from "@/lib/auth"
import { getAuthenticatedUserId } from "@/lib/auth-request"
import { applyRateLimit, createRateLimitHeaders, getRateLimitIdentifier } from "@/lib/rate-limiter"
import { captureException, logEvent, withRateLimitHeaders } from "@/lib/observability"
import type { ApiResponse, ReadingRoom } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ReadingRoom>>> {
  try {
    const hostId = getAuthenticatedUserId(request)
    if (!hostId) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      )
    }

    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(
      request,
      "room",
      getRateLimitIdentifier(request, hostId),
    )
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "reading_room.create_rate_limited", request, userId: hostId })
      return rateLimitResponse as NextResponse<ApiResponse<ReadingRoom>>
    }

    const payload = await request.json()
    const code = generateRoomCode()

    const [newRoom] = await sql(
      `INSERT INTO reading_rooms (code, manhwa_id, chapter_id, host_id, room_name, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, code, manhwa_id, chapter_id, host_id, room_name, current_scroll_position, is_active, max_participants, created_at, expires_at`,
      [code, payload.manhwaId, payload.chapterId, hostId, payload.roomName, payload.maxParticipants || 10],
    )

    const response = NextResponse.json(
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
    logEvent({ event: "reading_room.created", request, userId: hostId, metadata: { roomId: newRoom.id, chapterId: payload.chapterId, manhwaId: payload.manhwaId } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "reading_room.create_failed", request, error })
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
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(
      request,
      "room",
      getRateLimitIdentifier(request, userId),
    )
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "reading_room.sync_rate_limited", request, userId })
      return rateLimitResponse as NextResponse<ApiResponse<ReadingRoom>>
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

    const response = NextResponse.json({
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
    logEvent({ event: "reading_room.synced", request, userId, metadata: { roomId, currentPageIndex } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "reading_room.sync_failed", request, error })
    return NextResponse.json(
      { success: false, error: "Failed to update room" },
      { status: 500 },
    )
  }
}

// Delete a reading room (host only)
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const userId = getAuthenticatedUserId(request)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(
      request,
      "room",
      getRateLimitIdentifier(request, userId),
    )
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "reading_room.delete_rate_limited", request, userId })
      return rateLimitResponse as NextResponse<ApiResponse<{ deleted: boolean }>>
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

    const response = NextResponse.json({
      success: true,
      data: { deleted: true },
    })
    logEvent({ event: "reading_room.deleted", request, userId, metadata: { roomId } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "reading_room.delete_failed", request, error })
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
