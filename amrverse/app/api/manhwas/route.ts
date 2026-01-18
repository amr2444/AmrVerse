// Get all manhwas with pagination
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, PaginatedResponse, Manhwa } from "@/lib/types"

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PaginatedResponse<Manhwa>>>> {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "12")
    const offset = (page - 1) * pageSize

    // Get total count
    const [{ count }] = await sql("SELECT COUNT(*) as count FROM manhwas")
    const total = Number.parseInt(count)

    // Get paginated results
    const manhwas = await sql(
      `SELECT id, title, slug, description, cover_url, author, status, genre, rating, total_chapters, created_by, created_at, updated_at 
       FROM manhwas 
       ORDER BY updated_at DESC 
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    )

    const data: Manhwa[] = manhwas.map((m: any) => ({
      id: m.id,
      title: m.title,
      slug: m.slug,
      description: m.description,
      coverUrl: m.cover_url,
      author: m.author,
      status: m.status,
      genres: m.genre || [],
      rating: m.rating,
      totalChapters: m.total_chapters,
      createdBy: m.created_by,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
    }))

    return NextResponse.json({
      success: true,
      data: {
        data,
        total,
        page,
        pageSize,
        hasMore: offset + pageSize < total,
      },
    })
  } catch (error) {
    console.error("[v0] Get manhwas error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch manhwas",
      },
      { status: 500 },
    )
  }
}

// Create new manhwa (creator only)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Manhwa>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Please login",
        },
        { status: 401 },
      )
    }

    // Verify user from token
    const { getUserFromToken } = await import("@/lib/auth")
    const user = await getUserFromToken(token, sql)
    
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid token",
        },
        { status: 401 },
      )
    }

    if (!user.is_creator) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator access required. Please contact support to enable creator features.",
        },
        { status: 403 },
      )
    }

    const payload = await request.json()
    const slug = payload.slug || payload.title.toLowerCase().replace(/\s+/g, "-")

    const [newManhwa] = await sql(
      `INSERT INTO manhwas (title, slug, description, cover_url, author, status, genre, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, slug, description, cover_url, author, status, genre, rating, total_chapters, created_by, created_at, updated_at`,
      [
        payload.title,
        slug,
        payload.description,
        payload.coverUrl,
        payload.author,
        payload.status || "ongoing",
        payload.genre || [],
        user.id, // Use authenticated user ID
      ],
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newManhwa.id,
          title: newManhwa.title,
          slug: newManhwa.slug,
          description: newManhwa.description,
          coverUrl: newManhwa.cover_url,
          author: newManhwa.author,
          status: newManhwa.status,
          genres: newManhwa.genre,
          rating: newManhwa.rating,
          totalChapters: newManhwa.total_chapters,
          createdBy: newManhwa.created_by,
          createdAt: newManhwa.created_at,
          updatedAt: newManhwa.updated_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create manhwa error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create manhwa",
      },
      { status: 500 },
    )
  }
}
