// Get chapters for a manhwa
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, Chapter } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Chapter[]>>> {
  try {
    const { id } = await params
    const chapters = await sql(
      `SELECT id, manhwa_id, chapter_number, title, description, pages_count, published_at, created_at, updated_at
       FROM chapters 
       WHERE manhwa_id = $1 
       ORDER BY chapter_number DESC`,
      [id],
    )

    const data: Chapter[] = chapters.map((c: any) => ({
      id: c.id,
      manhwaId: c.manhwa_id,
      chapterNumber: c.chapter_number,
      title: c.title,
      description: c.description,
      pagesCount: c.pages_count,
      publishedAt: c.published_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("[v0] Get chapters error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch chapters",
      },
      { status: 500 },
    )
  }
}

// Create new chapter (creator only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Chapter>>> {
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
          error: "Creator access required",
        },
        { status: 403 },
      )
    }

    const { id: manhwaId } = await params
    const payload = await request.json()

    // Verify user owns this manhwa
    const [manhwa] = await sql(
      "SELECT created_by FROM manhwas WHERE id = $1",
      [manhwaId]
    )

    if (!manhwa || manhwa.created_by !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only add chapters to your own manhwas",
        },
        { status: 403 },
      )
    }

    const [newChapter] = await sql(
      `INSERT INTO chapters (manhwa_id, chapter_number, title, description, pages_count)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, manhwa_id, chapter_number, title, description, pages_count, published_at, created_at, updated_at`,
      [
        manhwaId,
        payload.chapterNumber,
        payload.title || null,
        payload.description || null,
        0,
      ],
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newChapter.id,
          manhwaId: newChapter.manhwa_id,
          chapterNumber: newChapter.chapter_number,
          title: newChapter.title,
          description: newChapter.description,
          pagesCount: newChapter.pages_count,
          publishedAt: newChapter.published_at,
          createdAt: newChapter.created_at,
          updatedAt: newChapter.updated_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create chapter error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create chapter",
      },
      { status: 500 },
    )
  }
}
