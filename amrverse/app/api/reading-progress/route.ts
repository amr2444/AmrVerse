// Save and get reading progress
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import type { ApiResponse } from "@/lib/types"

interface ReadingProgress {
  userId: string
  chapterId: string
  lastPageRead: number
  completed: boolean
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<ReadingProgress>>> {
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

    const payload = await request.json()

    // Insert or update reading progress
    const [progress] = await sql(
      `INSERT INTO reading_progress (user_id, chapter_id, last_page_read, completed)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, chapter_id) DO UPDATE SET
       last_page_read = $3, completed = $4, last_read_at = NOW()
       RETURNING user_id, chapter_id, last_page_read, completed`,
      [payload.userId, payload.chapterId, payload.lastPageRead, payload.completed],
    )

    return NextResponse.json({
      success: true,
      data: {
        userId: progress.user_id,
        chapterId: progress.chapter_id,
        lastPageRead: progress.last_page_read,
        completed: progress.completed,
      },
    })
  } catch (error) {
    console.error("[v0] Save progress error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save progress",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<ReadingProgress[]>>> {
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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const progress = await sql(
      `SELECT user_id, chapter_id, last_page_read, completed
       FROM reading_progress 
       WHERE user_id = $1
       ORDER BY last_read_at DESC`,
      [userId],
    )

    return NextResponse.json({
      success: true,
      data: progress.map((p: any) => ({
        userId: p.user_id,
        chapterId: p.chapter_id,
        lastPageRead: p.last_page_read,
        completed: p.completed,
      })),
    })
  } catch (error) {
    console.error("[v0] Get progress error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch progress",
      },
      { status: 500 },
    )
  }
}
