// Manage individual chapter (GET, DELETE, PATCH)
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse, Chapter } from "@/lib/types"

// Get single chapter
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Chapter>>> {
  try {
    const { id } = await params
    const [chapter] = await sql(
      `SELECT id, manhwa_id, chapter_number, title, description, pages_count, published_at, created_at, updated_at
       FROM chapters WHERE id = $1`,
      [id],
    )

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: chapter.id,
        manhwaId: chapter.manhwa_id,
        chapterNumber: chapter.chapter_number,
        title: chapter.title,
        description: chapter.description,
        pagesCount: chapter.pages_count,
        publishedAt: chapter.published_at,
        createdAt: chapter.created_at,
        updatedAt: chapter.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Get chapter error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch chapter" },
      { status: 500 },
    )
  }
}

// Delete chapter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login" },
        { status: 401 },
      )
    }

    // Verify user from token
    const { getUserFromToken } = await import("@/lib/auth")
    const user = await getUserFromToken(token, sql)

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      )
    }

    if (!user.is_creator) {
      return NextResponse.json(
        { success: false, error: "Creator access required" },
        { status: 403 },
      )
    }

    const { id } = await params

    // Get chapter and verify ownership
    const [chapter] = await sql(
      `SELECT c.id, c.manhwa_id, m.created_by 
       FROM chapters c 
       JOIN manhwas m ON c.manhwa_id = m.id 
       WHERE c.id = $1`,
      [id],
    )

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 },
      )
    }

    if (chapter.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only delete chapters from your own manhwas" },
        { status: 403 },
      )
    }

    // Delete chapter pages first (foreign key constraint)
    await sql("DELETE FROM chapter_pages WHERE chapter_id = $1", [id])
    
    // Delete reading progress for this chapter
    await sql("DELETE FROM reading_progress WHERE chapter_id = $1", [id])

    // Delete the chapter
    await sql("DELETE FROM chapters WHERE id = $1", [id])

    // Update manhwa total_chapters count
    await sql(
      `UPDATE manhwas 
       SET total_chapters = (SELECT COUNT(*) FROM chapters WHERE manhwa_id = $1),
           updated_at = NOW()
       WHERE id = $1`,
      [chapter.manhwa_id],
    )

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    console.error("[v0] Delete chapter error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to delete chapter" },
      { status: 500 },
    )
  }
}

// Update chapter
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Chapter>>> {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Please login" },
        { status: 401 },
      )
    }

    // Verify user from token
    const { getUserFromToken } = await import("@/lib/auth")
    const user = await getUserFromToken(token, sql)

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 },
      )
    }

    if (!user.is_creator) {
      return NextResponse.json(
        { success: false, error: "Creator access required" },
        { status: 403 },
      )
    }

    const { id } = await params
    const payload = await request.json()

    // Get chapter and verify ownership
    const [chapter] = await sql(
      `SELECT c.id, c.manhwa_id, m.created_by 
       FROM chapters c 
       JOIN manhwas m ON c.manhwa_id = m.id 
       WHERE c.id = $1`,
      [id],
    )

    if (!chapter) {
      return NextResponse.json(
        { success: false, error: "Chapter not found" },
        { status: 404 },
      )
    }

    if (chapter.created_by !== user.id) {
      return NextResponse.json(
        { success: false, error: "You can only update chapters from your own manhwas" },
        { status: 403 },
      )
    }

    // Update chapter
    const [updatedChapter] = await sql(
      `UPDATE chapters 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           chapter_number = COALESCE($3, chapter_number),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, manhwa_id, chapter_number, title, description, pages_count, published_at, created_at, updated_at`,
      [payload.title, payload.description, payload.chapterNumber, id],
    )

    return NextResponse.json({
      success: true,
      data: {
        id: updatedChapter.id,
        manhwaId: updatedChapter.manhwa_id,
        chapterNumber: updatedChapter.chapter_number,
        title: updatedChapter.title,
        description: updatedChapter.description,
        pagesCount: updatedChapter.pages_count,
        publishedAt: updatedChapter.published_at,
        createdAt: updatedChapter.created_at,
        updatedAt: updatedChapter.updated_at,
      },
    })
  } catch (error) {
    console.error("[v0] Update chapter error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update chapter" },
      { status: 500 },
    )
  }
}
