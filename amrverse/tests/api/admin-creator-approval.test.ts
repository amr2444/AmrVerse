import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { mockSql, mockGetAuthenticatedUser, mockSendCreatorApprovalEmail, mockSendCreatorRejectionEmail } = vi.hoisted(() => ({
  mockSql: vi.fn(),
  mockGetAuthenticatedUser: vi.fn(),
  mockSendCreatorApprovalEmail: vi.fn(),
  mockSendCreatorRejectionEmail: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ default: mockSql }))
vi.mock("@/lib/auth-request", () => ({ getAuthenticatedUser: mockGetAuthenticatedUser }))
vi.mock("@/lib/email", () => ({
  sendCreatorApprovalEmail: mockSendCreatorApprovalEmail,
  sendCreatorRejectionEmail: mockSendCreatorRejectionEmail,
}))
vi.mock("@/lib/observability", () => ({
  logEvent: vi.fn(),
  captureException: vi.fn(),
  withRateLimitHeaders: vi.fn((response) => response),
}))
vi.mock("@/lib/rate-limiter", () => ({
  applyRateLimit: vi.fn(() => ({
    result: { allowed: true, limit: 60, remaining: 59, resetTime: Date.now() + 1000 },
    response: null,
  })),
  createRateLimitHeaders: vi.fn(() => ({ "X-RateLimit-Limit": "60" })),
  getRateLimitIdentifier: vi.fn(() => "admin-1"),
}))

import { PATCH } from "@/app/api/admin/creator-requests/[id]/route"

describe("PATCH /api/admin/creator-requests/[id]", () => {
  beforeEach(() => {
    mockSql.mockReset()
    mockGetAuthenticatedUser.mockReset()
    mockSendCreatorApprovalEmail.mockReset()
    mockSendCreatorRejectionEmail.mockReset()
  })

  it("blocks non-admin users", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "user-1", isAdmin: false })

    const request = new NextRequest("http://localhost:3000/api/admin/creator-requests/req-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "approve" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) })
    expect(response.status).toBe(403)
  })

  it("approves a creator request and sends a confirmation email", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: "admin-1", isAdmin: true })
    mockSql
      .mockResolvedValueOnce([
        { user_id: "user-1", email: "reader@example.com", full_name: "Reader One" },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
    mockSendCreatorApprovalEmail.mockResolvedValue({ success: true })

    const request = new NextRequest("http://localhost:3000/api/admin/creator-requests/req-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "approve", adminNotes: "Great portfolio" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await PATCH(request, { params: Promise.resolve({ id: "req-1" }) })
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.data.message).toContain("maintenant createur")
    expect(mockSendCreatorApprovalEmail).toHaveBeenCalledWith({
      userName: "Reader One",
      userEmail: "reader@example.com",
    })
  })
})
