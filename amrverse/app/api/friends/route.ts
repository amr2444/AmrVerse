// Manage friendships - SECURED: userId extracted from JWT token
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserIdFromToken } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

interface Friend {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  status: "pending" | "accepted" | "blocked"
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Friend[]>>> {
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
    const status = searchParams.get("status") || "accepted"

    // Get friends
    const friends = await sql(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, f.status
       FROM friendships f
       JOIN users u ON CASE 
         WHEN f.user_id_1 = $1 THEN u.id = f.user_id_2
         ELSE u.id = f.user_id_1
       END
       WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) AND f.status = $2
       ORDER BY f.created_at DESC`,
      [userId, status],
    )

    return NextResponse.json({
      success: true,
      data: friends.map((f: any) => ({
        id: f.id,
        username: f.username,
        displayName: f.display_name,
        avatarUrl: f.avatar_url,
        status: f.status,
      })),
    })
  } catch (error) {
    console.error("[v0] Get friends error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch friends",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Friend>>> {
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

    // SECURITY FIX: Extract userId from JWT token instead of request body
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 },
      )
    }

    const payload = await request.json()
    const { friendId } = payload

    if (!friendId) {
      return NextResponse.json(
        {
          success: false,
          error: "friendId is required",
        },
        { status: 400 },
      )
    }

    // Prevent adding yourself as a friend
    if (userId === friendId) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot add yourself as a friend",
        },
        { status: 400 },
      )
    }

    // Ensure consistent ordering (smaller ID first)
    const [id1, id2] = userId < friendId ? [userId, friendId] : [friendId, userId]

    const [friendship] = await sql(
      `INSERT INTO friendships (user_id_1, user_id_2, status)
       VALUES ($1, $2, 'pending')
       ON CONFLICT (user_id_1, user_id_2) DO UPDATE SET status = 'pending'
       RETURNING user_id_1, user_id_2, status, created_at`,
      [id1, id2],
    )

    const [friend] = await sql("SELECT id, username, display_name, avatar_url FROM users WHERE id = $1", [friendId])

    return NextResponse.json(
      {
        success: true,
        data: {
          id: friend.id,
          username: friend.username,
          displayName: friend.display_name,
          avatarUrl: friend.avatar_url,
          status: friendship.status,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Add friend error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send friend request",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse<ApiResponse<Friend>>> {
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

    // SECURITY FIX: Extract userId from JWT token instead of request body
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 },
      )
    }

    const payload = await request.json()
    const { friendId, action } = payload

    if (!friendId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: "friendId and action are required",
        },
        { status: 400 },
      )
    }

    // Validate action
    if (!["accept", "reject", "block"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid action. Must be 'accept', 'reject', or 'block'",
        },
        { status: 400 },
      )
    }

    const [id1, id2] = userId < friendId ? [userId, friendId] : [friendId, userId]
    const newStatus = action === "accept" ? "accepted" : action === "reject" ? "blocked" : "pending"

    const [friendship] = await sql(
      `UPDATE friendships SET status = $1, updated_at = NOW()
       WHERE (user_id_1 = $2 AND user_id_2 = $3) OR (user_id_1 = $3 AND user_id_2 = $2)
       RETURNING status`,
      [newStatus, id1, id2],
    )

    if (!friendship) {
      return NextResponse.json(
        {
          success: false,
          error: "Friendship not found",
        },
        { status: 404 },
      )
    }

    const [friend] = await sql("SELECT id, username, display_name, avatar_url FROM users WHERE id = $1", [friendId])

    return NextResponse.json({
      success: true,
      data: {
        id: friend.id,
        username: friend.username,
        displayName: friend.display_name,
        avatarUrl: friend.avatar_url,
        status: friendship.status,
      },
    })
  } catch (error) {
    console.error("[v0] Update friendship error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update friendship",
      },
      { status: 500 },
    )
  }
}
