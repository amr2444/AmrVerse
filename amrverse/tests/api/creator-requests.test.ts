import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockSql, mockGetAuthenticatedUserId, mockSendCreatorRequestToAdmin, mockSendCreatorSubmissionConfirmationEmail } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockGetAuthenticatedUserId: vi.fn(),
  mockSendCreatorRequestToAdmin: vi.fn(),
  mockSendCreatorSubmissionConfirmationEmail: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ default: mockSql }))
vi.mock("@/lib/auth-request", () => ({ getAuthenticatedUserId: mockGetAuthenticatedUserId }))
vi.mock("@/lib/email", () => ({
  sendCreatorRequestToAdmin: mockSendCreatorRequestToAdmin,
  sendCreatorSubmissionConfirmationEmail: mockSendCreatorSubmissionConfirmationEmail,
}))
vi.mock("@/lib/observability", () => ({
  logEvent: vi.fn(),
  captureException: vi.fn(),
  withRateLimitHeaders: vi.fn((response) => response),
}))
vi.mock("@/lib/rate-limiter", () => ({
  applyRateLimit: vi.fn(() => ({
    result: { allowed: true, limit: 10, remaining: 9, resetTime: Date.now() + 1000 },
    response: null,
  })),
  createRateLimitHeaders: vi.fn(() => ({ "X-RateLimit-Limit": "10" })),
  getRateLimitIdentifier: vi.fn(() => "user-1"),
}))

import { POST } from "@/app/api/creator-requests/route"

describe("POST /api/creator-requests", () => {
  beforeEach(() => {
    mockSql.mockReset()
    mockGetAuthenticatedUserId.mockReset()
    mockSendCreatorRequestToAdmin.mockReset()
    mockSendCreatorSubmissionConfirmationEmail.mockReset()
  })

  it("rejects unauthenticated users", async () => {
    mockGetAuthenticatedUserId.mockReturnValue(null)

    const request = new NextRequest("http://localhost:3000/api/creator-requests", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("creates a request and sends admin notification links", async () => {
    mockGetAuthenticatedUserId.mockReturnValue("user-1")
    mockSql
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: "req-1",
          user_id: "user-1",
          full_name: "Reader One",
          email: "reader@example.com",
          presentation: "a".repeat(55),
          motivation: "b".repeat(55),
          portfolio_url: "https://portfolio.example.com",
          status: "pending",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ])
    mockSendCreatorRequestToAdmin.mockResolvedValue({ success: true })
    mockSendCreatorSubmissionConfirmationEmail.mockResolvedValue({ success: true })

    const request = new NextRequest("http://localhost:3000/api/creator-requests", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Reader One",
        email: "reader@example.com",
        presentation: "a".repeat(55),
        motivation: "b".repeat(55),
        portfolioUrl: "https://portfolio.example.com",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json.data.id).toBe("req-1")
    expect(mockSendCreatorRequestToAdmin).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "req-1",
        approveUrl: expect.stringContaining("action=approve"),
        rejectUrl: expect.stringContaining("action=reject"),
      }),
    )
    expect(mockSendCreatorSubmissionConfirmationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        userEmail: "reader@example.com",
        submissionType: "initial",
      }),
    )
  })
})
