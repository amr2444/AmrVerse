// Get single manhwa by ID
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, Manhwa } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Manhwa>>> {
  try {
    const { id } = await params
    const [manhwa] = await sql(
      `SELECT id, title, slug, description, cover_url, author, status, genre, rating, total_chapters, created_by, created_at, updated_at 
       FROM manhwas 
       WHERE slug = $1 OR (id::text = $1)`,
      [id],
    )

    if (!manhwa) {
      return NextResponse.json(
        {
          success: false,
          error: "Manhwa not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: manhwa.id,
        title: manhwa.title,
        slug: manhwa.slug,
        description: manhwa.description,
        coverUrl: manhwa.cover_url,
        author: manhwa.author,
        status: manhwa.status,
        genres: manhwa.genre || [],
        rating: manhwa.rating,
        totalChapters: manhwa.total_chapters,
        createdBy: manhwa.created_by,
        createdAt: manhwa.created_at,
        updatedAt: manhwa.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Get manhwa error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch manhwa",
      },
      { status: 500 },
    )
  }
}
