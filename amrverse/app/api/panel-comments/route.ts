// Save and retrieve panel comments (comments on specific manga panels) - SECURED
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserIdFromToken } from "@/lib/auth"
import { sanitizeInput } from "@/lib/validations"
import type { ApiResponse, PanelComment } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<PanelComment>>> {
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

    if (!payload.chapterPageId || !payload.roomId || !payload.comment) {
      return NextResponse.json(
        { success: false, error: "chapterPageId, roomId, and comment are required" },
        { status: 400 },
      )
    }

    // Validate comment length
    if (payload.comment.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Comment too long (max 1000 characters)" },
        { status: 400 },
      )
    }

    // Sanitize comment content to prevent XSS
    const sanitizedComment = sanitizeInput(payload.comment)

    const [comment] = await sql(
      `INSERT INTO panel_comments (chapter_page_id, room_id, user_id, comment, x_position, y_position)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, chapter_page_id, room_id, user_id, comment, x_position, y_position, created_at, updated_at`,
      [payload.chapterPageId, payload.roomId, userId, sanitizedComment, payload.xPosition, payload.yPosition],
    )

    return NextResponse.json(
      {
        success: true,
        data: {
          id: comment.id,
          chapterPageId: comment.chapter_page_id,
          roomId: comment.room_id,
          userId: comment.user_id,
          comment: comment.comment,
          xPosition: comment.x_position,
          yPosition: comment.y_position,
          createdAt: comment.created_at,
          updatedAt: comment.updated_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Save panel comment error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save comment",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<PanelComment[]>>> {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get("pageId")
    const roomId = searchParams.get("roomId")

    if (!pageId || !roomId) {
      return NextResponse.json(
        {
          success: false,
          error: "pageId and roomId are required",
        },
        { status: 400 },
      )
    }

    const comments = await sql(
      `SELECT id, chapter_page_id, room_id, user_id, comment, x_position, y_position, created_at, updated_at
       FROM panel_comments
       WHERE chapter_page_id = $1 AND room_id = $2
       ORDER BY created_at ASC`,
      [pageId, roomId],
    )

    return NextResponse.json({
      success: true,
      data: comments.map((c: any) => ({
        id: c.id,
        chapterPageId: c.chapter_page_id,
        roomId: c.room_id,
        userId: c.user_id,
        comment: c.comment,
        xPosition: c.x_position,
        yPosition: c.y_position,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })),
    })
  } catch (error) {
    console.error("[v0] Get panel comments error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch comments",
      },
      { status: 500 },
    )
  }
}
