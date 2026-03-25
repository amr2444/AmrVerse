import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockPut, mockGetAuthenticatedUserId } = vi.hoisted(() => ({
  mockPut: vi.fn(),
  mockGetAuthenticatedUserId: vi.fn(),
}))

vi.mock("@vercel/blob", () => ({ put: mockPut, del: vi.fn() }))
vi.mock("@/lib/auth-request", () => ({ getAuthenticatedUserId: mockGetAuthenticatedUserId }))
vi.mock("@/lib/observability", () => ({
  logEvent: vi.fn(),
  captureException: vi.fn(),
  withRateLimitHeaders: vi.fn((response) => response),
}))
vi.mock("@/lib/rate-limiter", () => ({
  applyRateLimit: vi.fn(() => ({
    result: { allowed: true, limit: 50, remaining: 49, resetTime: Date.now() + 1000 },
    response: null,
  })),
  createRateLimitHeaders: vi.fn(() => ({ "X-RateLimit-Limit": "50" })),
  getRateLimitIdentifier: vi.fn(() => "creator-1"),
}))

import { POST } from "@/app/api/upload/route"

describe("POST /api/upload", () => {
  beforeEach(() => {
    process.env.BLOB_READ_WRITE_TOKEN = "blob-token"
    mockPut.mockReset()
    mockGetAuthenticatedUserId.mockReset()
  })

  it("returns 401 for unauthenticated uploads", async () => {
    mockGetAuthenticatedUserId.mockReturnValue(null)

    const formData = new FormData()
    formData.set("file", new File([Uint8Array.from([0xff, 0xd8, 0xff, 0xdb])], "cover.jpg", { type: "image/jpeg" }))
    const request = new NextRequest("http://localhost:3000/api/upload", { method: "POST", body: formData })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("uploads valid image files to blob storage", async () => {
    mockGetAuthenticatedUserId.mockReturnValue("creator-1")
    mockPut.mockResolvedValue({ url: "https://blob.example.com/file.jpg", pathname: "uploads/creator-1/file.jpg" })

    const jpegBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x43, 0x00])
    const formData = new FormData()
    formData.set("file", new File([jpegBytes], "cover.jpg", { type: "image/jpeg" }))

    const request = new NextRequest("http://localhost:3000/api/upload", { method: "POST", body: formData })
    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.data.url).toBe("https://blob.example.com/file.jpg")
    expect(mockPut).toHaveBeenCalledOnce()
  })
})
