// Get user profile with stats
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, UserProfile } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<UserProfile>>> {
  try {
    const { id } = await params
    const [user] = await sql(
      `SELECT id, email, username, display_name, avatar_url, bio, is_creator, created_at, updated_at
       FROM users WHERE id = $1`,
      [id],
    )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    // Get user stats
    const [favoriteCount] = await sql("SELECT COUNT(*) as count FROM user_favorites WHERE user_id = $1", [id])

    const [progressCount] = await sql(
      "SELECT COUNT(*) as count FROM reading_progress WHERE user_id = $1 AND completed = true",
      [id],
    )

    const [friendCount] = await sql(
      `SELECT COUNT(*) as count FROM friendships 
       WHERE (user_id_1 = $1 OR user_id_2 = $1) AND status = 'accepted'`,
      [id],
    )

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        isCreator: user.is_creator,
        favoriteCount: Number.parseInt(favoriteCount.count),
        friendCount: Number.parseInt(friendCount.count),
        totalChaptersRead: Number.parseInt(progressCount.count),
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Get profile error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch profile",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<UserProfile>>> {
  try {
    const { id } = await params
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

    // SECURITY FIX: Import and verify token, then check if user owns this profile
    const { getUserIdFromToken } = await import("@/lib/auth")
    const tokenUserId = getUserIdFromToken(token)
    
    if (!tokenUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired token",
        },
        { status: 401 },
      )
    }

    // SECURITY FIX: Ensure user can only update their own profile
    if (tokenUserId !== id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only update your own profile",
        },
        { status: 403 },
      )
    }

    const payload = await request.json()

    const [updatedUser] = await sql(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name),
           avatar_url = COALESCE($2, avatar_url),
           bio = COALESCE($3, bio),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, username, display_name, avatar_url, bio, is_creator, created_at, updated_at`,
      [payload.displayName, payload.avatarUrl, payload.bio, id],
    )

    if (!updatedUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    const [favoriteCount] = await sql("SELECT COUNT(*) as count FROM user_favorites WHERE user_id = $1", [id])
    const [progressCount] = await sql(
      "SELECT COUNT(*) as count FROM reading_progress WHERE user_id = $1 AND completed = true",
      [id],
    )
    const [friendCount] = await sql(
      `SELECT COUNT(*) as count FROM friendships WHERE (user_id_1 = $1 OR user_id_2 = $1) AND status = 'accepted'`,
      [id],
    )

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        avatarUrl: updatedUser.avatar_url,
        bio: updatedUser.bio,
        isCreator: updatedUser.is_creator,
        favoriteCount: Number.parseInt(favoriteCount.count),
        friendCount: Number.parseInt(friendCount.count),
        totalChaptersRead: Number.parseInt(progressCount.count),
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Update profile error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update profile",
      },
      { status: 500 },
    )
  }
}
