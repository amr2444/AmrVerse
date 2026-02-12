// Get pages for a chapter
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, ChapterPage } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<ChapterPage[]>>> {
  try {
    const { id } = await params
    const pages = await sql(
      `SELECT id, chapter_id, page_number, image_url, image_height, created_at
       FROM chapter_pages 
       WHERE chapter_id = $1 
       ORDER BY page_number ASC`,
      [id],
    )

    const data: ChapterPage[] = pages.map((p: any) => ({
      id: p.id,
      chapterId: p.chapter_id,
      pageNumber: p.page_number,
      imageUrl: p.image_url,
      imageHeight: p.image_height,
      createdAt: p.created_at,
    }))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("[v0] Get pages error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch pages",
      },
      { status: 500 },
    )
  }
}

// Create pages for a chapter
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<ChapterPage[]>>> {
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
    
    if (!user || !user.isCreator) {
      return NextResponse.json(
        {
          success: false,
          error: "Creator access required",
        },
        { status: 403 },
      )
    }

    const { id } = await params
    const body = await request.json()
    const { pages } = body

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Pages array is required",
        },
        { status: 400 },
      )
    }

    // Verify user owns this chapter's manhwa
    const [chapter] = await sql(
      `SELECT c.id, m.created_by 
       FROM chapters c 
       JOIN manhwas m ON c.manhwa_id = m.id 
       WHERE c.id = $1`,
      [id]
    )

    if (!chapter || chapter.created_by !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only add pages to your own chapters",
        },
        { status: 403 },
      )
    }

    // Delete existing pages for this chapter first
    await sql(
      `DELETE FROM chapter_pages WHERE chapter_id = $1`,
      [id],
    )

    // Insert new pages
    const createdPages: ChapterPage[] = []
    for (const page of pages) {
      const result = await sql(
        `INSERT INTO chapter_pages (chapter_id, page_number, image_url, image_height)
         VALUES ($1, $2, $3, $4)
         RETURNING id, chapter_id, page_number, image_url, image_height, created_at`,
        [id, page.pageNumber, page.imageUrl, page.imageHeight || 800],
      )
      
      if (result.length > 0) {
        const p = result[0]
        createdPages.push({
          id: p.id,
          chapterId: p.chapter_id,
          pageNumber: p.page_number,
          imageUrl: p.image_url,
          imageHeight: p.image_height,
          createdAt: p.created_at,
        })
      }
    }

    // Update chapter pages_count
    await sql(
      `UPDATE chapters SET pages_count = $1 WHERE id = $2`,
      [createdPages.length, id],
    )

    return NextResponse.json(
      {
        success: true,
        data: createdPages,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Create pages error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create pages",
      },
      { status: 500 },
    )
  }
}
