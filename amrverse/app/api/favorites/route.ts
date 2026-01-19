// Add/Remove favorites - SECURED: userId extracted from JWT token
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserIdFromToken } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

interface FavoriteResponse {
  userId: string
  manhwaId: string
  isFavorite: boolean
}

// Add to favorites
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<FavoriteResponse>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // SECURITY FIX: Extract userId from JWT token instead of request body
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    const { manhwaId } = await request.json()

    if (!manhwaId) {
      return NextResponse.json(
        { success: false, error: "Missing manhwaId" },
        { status: 400 }
      )
    }

    await sql(
      `INSERT INTO user_favorites (user_id, manhwa_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, manhwa_id) DO NOTHING`,
      [userId, manhwaId]
    )

    return NextResponse.json({
      success: true,
      data: { userId, manhwaId, isFavorite: true },
    })
  } catch (error) {
    console.error("[v0] Add favorite error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to add favorite" },
      { status: 500 }
    )
  }
}

// Remove from favorites
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<FavoriteResponse>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // SECURITY FIX: Extract userId from JWT token instead of query params
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const manhwaId = searchParams.get("manhwaId")

    if (!manhwaId) {
      return NextResponse.json(
        { success: false, error: "Missing manhwaId" },
        { status: 400 }
      )
    }

    await sql(
      `DELETE FROM user_favorites WHERE user_id = $1 AND manhwa_id = $2`,
      [userId, manhwaId]
    )

    return NextResponse.json({
      success: true,
      data: { userId, manhwaId, isFavorite: false },
    })
  } catch (error) {
    console.error("[v0] Remove favorite error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to remove favorite" },
      { status: 500 }
    )
  }
}

// Get user's favorites
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<{ favorites: string[] }>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    // SECURITY FIX: Extract userId from JWT token instead of query params
    const userId = getUserIdFromToken(token)
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired token" },
        { status: 401 }
      )
    }

    const favorites = await sql(
      `SELECT manhwa_id FROM user_favorites WHERE user_id = $1`,
      [userId]
    )

    return NextResponse.json({
      success: true,
      data: { favorites: favorites.map((f: any) => f.manhwa_id) },
    })
  } catch (error) {
    console.error("[v0] Get favorites error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to get favorites" },
      { status: 500 }
    )
  }
}
