import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockSql, mockGetAuthenticatedUser } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockGetAuthenticatedUser: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ default: mockSql }))
vi.mock("@/lib/auth-request", () => ({ getAuthenticatedUser: mockGetAuthenticatedUser }))

import { GET } from "@/app/api/dashboard/route"

describe("GET /api/dashboard", () => {
  beforeEach(() => {
    mockSql.mockReset()
    mockGetAuthenticatedUser.mockReset()
  })

  it("returns 401 when the user is not authenticated", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null)

    const response = await GET(new NextRequest("http://localhost:3000/api/dashboard"))
    expect(response.status).toBe(401)
  })

  it("returns dashboard data scoped to the authenticated user", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-123" })
    mockSql
      .mockResolvedValueOnce([
        {
          manhwa_id: "m1",
          manhwa_title: "Solo Leveling",
          manhwa_slug: "solo-leveling",
          manhwa_cover_url: null,
          chapter_id: "c1",
          chapter_number: 1,
          chapter_title: "Start",
          total_pages: 12,
          last_page_read: 4,
          completed: false,
          last_read_at: "2026-01-01T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "m1",
          title: "Solo Leveling",
          slug: "solo-leveling",
          description: "desc",
          cover_url: null,
          author: "Author",
          status: "ongoing",
          genre: ["Action"],
          rating: 4.9,
          total_chapters: 10,
          created_by: "creator-1",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "room-1",
          code: "ABCD12",
          manhwa_id: "m1",
          chapter_id: "c1",
          host_id: "user-123",
          room_name: "Room 1",
          current_scroll_position: 50,
          current_page_index: 2,
          is_active: true,
          max_participants: 10,
          sync_enabled: true,
          created_at: "2026-01-01T00:00:00.000Z",
          expires_at: "2027-01-01T00:00:00.000Z",
          manhwa_title: "Solo Leveling",
          manhwa_cover_url: null,
          participant_count: "2",
        },
      ])
      .mockResolvedValueOnce([{ chapters_read: "3", favorites_count: "1", active_rooms: "1" }])

    const response = await GET(new NextRequest("http://localhost:3000/api/dashboard"))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.stats).toEqual({ totalChaptersRead: 3, totalFavorites: 1, activeRoomsCount: 1 })
    expect(mockSql).toHaveBeenCalledWith(expect.any(String), ["user-123"])
  })
})
