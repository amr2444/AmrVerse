// Search users by username or display name
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse } from "@/lib/types"

interface SearchUser {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  isCreator: boolean
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SearchUser[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const currentUserId = searchParams.get("currentUserId")

    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Search users by username or display_name, excluding current user
    const searchPattern = `%${query.toLowerCase()}%`
    
    let users
    if (currentUserId) {
      users = await sql(
        `SELECT id, username, display_name, avatar_url, is_creator
         FROM users 
         WHERE (LOWER(username) LIKE $1 OR LOWER(display_name) LIKE $1)
         AND id != $2
         ORDER BY 
           CASE WHEN LOWER(username) = $3 THEN 0
                WHEN LOWER(username) LIKE $4 THEN 1
                ELSE 2 END,
           username ASC
         LIMIT 20`,
        [searchPattern, currentUserId, query.toLowerCase(), `${query.toLowerCase()}%`]
      )
    } else {
      users = await sql(
        `SELECT id, username, display_name, avatar_url, is_creator
         FROM users 
         WHERE LOWER(username) LIKE $1 OR LOWER(display_name) LIKE $1
         ORDER BY 
           CASE WHEN LOWER(username) = $2 THEN 0
                WHEN LOWER(username) LIKE $3 THEN 1
                ELSE 2 END,
           username ASC
         LIMIT 20`,
        [searchPattern, query.toLowerCase(), `${query.toLowerCase()}%`]
      )
    }

    return NextResponse.json({
      success: true,
      data: users.map((u: any) => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
        avatarUrl: u.avatar_url,
        isCreator: u.is_creator,
      })),
    })
  } catch (error) {
    console.error("[v0] Search users error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to search users",
      },
      { status: 500 }
    )
  }
}
