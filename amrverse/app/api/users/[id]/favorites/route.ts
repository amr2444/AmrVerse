// Get user favorites
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, Manhwa } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Manhwa[]>>> {
  try {
    const { id } = await params
    const manhwas = await sql(
      `SELECT m.id, m.title, m.slug, m.description, m.cover_url, m.author, m.status, m.genre, m.rating, m.total_chapters, m.created_by, m.created_at, m.updated_at
       FROM user_favorites uf
       JOIN manhwas m ON uf.manhwa_id = m.id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC`,
      [id],
    )

    return NextResponse.json({
      success: true,
      data: manhwas.map((m: any) => ({
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
      })),
    })
  } catch (error) {
    console.error("[v0] Get favorites error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch favorites",
      },
      { status: 500 },
    )
  }
}
