// Dashboard data API - Get user's reading progress, favorites, and active rooms
import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getAuthenticatedUser } from "@/lib/auth-request"
import { mapManhwaRow, mapReadingRoomRow } from "@/lib/server/mappers"
import type { ApiResponse, Manhwa, ReadingRoom } from "@/lib/types"

interface ReadingHistoryItem {
  manhwaId: string
  manhwaTitle: string
  manhwaSlug: string
  manhwaCoverUrl: string | null
  chapterId: string
  chapterNumber: number
  chapterTitle: string | null
  lastPageRead: number
  totalPages: number
  completed: boolean
  lastReadAt: string
}

interface DashboardData {
  readingHistory: ReadingHistoryItem[]
  favorites: Manhwa[]
  activeRooms: (ReadingRoom & { manhwaTitle: string; manhwaCoverUrl: string | null; participantCount: number })[]
  stats: {
    totalChaptersRead: number
    totalFavorites: number
    activeRoomsCount: number
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<DashboardData>>> {
  try {
    const user = await getAuthenticatedUser(request, sql)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }
    const userId = user.id

    // Get reading history with manhwa and chapter details
    const readingHistory = await sql(
      `SELECT 
        m.id as manhwa_id,
        m.title as manhwa_title,
        m.slug as manhwa_slug,
        m.cover_url as manhwa_cover_url,
        c.id as chapter_id,
        c.chapter_number,
        c.title as chapter_title,
        c.pages_count as total_pages,
        rp.last_page_read,
        rp.completed,
        rp.last_read_at
       FROM reading_progress rp
       JOIN chapters c ON rp.chapter_id = c.id
       JOIN manhwas m ON c.manhwa_id = m.id
       WHERE rp.user_id = $1
       ORDER BY rp.last_read_at DESC
       LIMIT 10`,
      [userId]
    )

    // Get favorites with manhwa details
    const favorites = await sql(
      `SELECT 
        m.id, m.title, m.slug, m.description, m.cover_url, 
        m.author, m.status, m.genre, m.rating, m.total_chapters,
        m.created_by, m.created_at, m.updated_at
       FROM user_favorites uf
       JOIN manhwas m ON uf.manhwa_id = m.id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC
       LIMIT 10`,
      [userId]
    )

    // Get active rooms (where user is host or participant)
    const activeRooms = await sql(
      `SELECT DISTINCT
        rr.id, rr.code, rr.manhwa_id, rr.chapter_id, rr.host_id,
        rr.room_name, rr.current_scroll_position, rr.current_page_index, 
        rr.is_active, rr.max_participants, rr.sync_enabled,
        rr.created_at, rr.expires_at,
        m.title as manhwa_title,
        m.cover_url as manhwa_cover_url,
        (SELECT COUNT(*) FROM room_participants WHERE room_id = rr.id) as participant_count
       FROM reading_rooms rr
       JOIN manhwas m ON rr.manhwa_id = m.id
       LEFT JOIN room_participants rp ON rr.id = rp.room_id
       WHERE (rr.host_id = $1 OR rp.user_id = $1)
         AND rr.is_active = true 
         AND rr.expires_at > NOW()
       ORDER BY rr.created_at DESC
       LIMIT 5`,
      [userId]
    )

    // Get stats
    const [statsResult] = await sql(
      `SELECT 
        (SELECT COUNT(*) FROM reading_progress WHERE user_id = $1 AND completed = true) as chapters_read,
        (SELECT COUNT(*) FROM user_favorites WHERE user_id = $1) as favorites_count,
        (SELECT COUNT(DISTINCT rr.id) FROM reading_rooms rr 
         LEFT JOIN room_participants rp ON rr.id = rp.room_id 
         WHERE (rr.host_id = $1 OR rp.user_id = $1) AND rr.is_active = true AND rr.expires_at > NOW()) as active_rooms`,
      [userId]
    )

    return NextResponse.json({
      success: true,
      data: {
        readingHistory: readingHistory.map((rh: any) => ({
          manhwaId: rh.manhwa_id,
          manhwaTitle: rh.manhwa_title,
          manhwaSlug: rh.manhwa_slug,
          manhwaCoverUrl: rh.manhwa_cover_url,
          chapterId: rh.chapter_id,
          chapterNumber: rh.chapter_number,
          chapterTitle: rh.chapter_title,
          lastPageRead: rh.last_page_read,
          totalPages: rh.total_pages,
          completed: rh.completed,
          lastReadAt: rh.last_read_at,
        })),
        favorites: favorites.map(mapManhwaRow),
        activeRooms: activeRooms.map((r: any) => ({
          ...mapReadingRoomRow(r),
          manhwaTitle: r.manhwa_title,
          manhwaCoverUrl: r.manhwa_cover_url,
          participantCount: parseInt(r.participant_count) || 0,
        })),
        stats: {
          totalChaptersRead: parseInt(statsResult?.chapters_read) || 0,
          totalFavorites: parseInt(statsResult?.favorites_count) || 0,
          activeRoomsCount: parseInt(statsResult?.active_rooms) || 0,
        },
      },
    })
  } catch (error) {
    console.error("[v0] Dashboard data error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}
