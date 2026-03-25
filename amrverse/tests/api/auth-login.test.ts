import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockSql, mockSetAuthCookies, mockLogEvent, mockCaptureException } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockSetAuthCookies: vi.fn(),
  mockLogEvent: vi.fn(),
  mockCaptureException: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ default: mockSql }))
vi.mock("@/lib/auth-cookies", () => ({ setAuthCookies: mockSetAuthCookies }))
vi.mock("@/lib/auth", () => ({
  generateTokenPair: vi.fn(() => ({ accessToken: "access-token", refreshToken: "refresh-token" })),
  hashPassword: vi.fn(() => "rehashed-password"),
  verifyPasswordWithMigration: vi.fn(),
}))
vi.mock("@/lib/observability", () => ({
  logEvent: mockLogEvent,
  captureException: mockCaptureException,
  withRateLimitHeaders: vi.fn((response) => response),
}))
vi.mock("@/lib/rate-limiter", () => ({
  getClientIP: vi.fn(() => "127.0.0.1"),
  applyRateLimit: vi.fn(() => ({
    result: { allowed: true, limit: 5, remaining: 4, resetTime: Date.now() + 1000 },
    response: null,
  })),
  createRateLimitHeaders: vi.fn(() => ({ "X-RateLimit-Limit": "5" })),
  resetRateLimit: vi.fn(),
}))

import { verifyPasswordWithMigration } from "@/lib/auth"
import { POST } from "@/app/api/auth/login/route"

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    mockSql.mockReset()
    mockSetAuthCookies.mockReset()
    mockLogEvent.mockReset()
    mockCaptureException.mockReset()
  })

  it("returns 400 when required fields are missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "", password: "" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe("Email and password are required")
  })

  it("returns 401 when credentials are invalid", async () => {
    mockSql.mockResolvedValueOnce([])

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "reader@example.com", password: "wrong" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe("Invalid email or password")
  })

  it("logs the user in and sets auth cookies", async () => {
    mockSql.mockResolvedValueOnce([
      {
        id: "user-1",
        email: "reader@example.com",
        username: "reader1",
        password_hash: "stored-hash",
        display_name: "Reader One",
        avatar_url: null,
        bio: null,
        is_creator: false,
        is_admin: false,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-02T00:00:00.000Z"),
      },
    ])
    vi.mocked(verifyPasswordWithMigration).mockReturnValue({ isValid: true, needsRehash: false })

    const request = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "reader@example.com", password: "GoodPassword123!" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.user.id).toBe("user-1")
    expect(json.data.accessToken).toBe("access-token")
    expect(mockSetAuthCookies).toHaveBeenCalledOnce()
    expect(mockLogEvent).toHaveBeenCalledWith(expect.objectContaining({ event: "auth.login.succeeded", userId: "user-1" }))
  })
})
