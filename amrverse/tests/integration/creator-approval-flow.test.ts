import { NextRequest } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { state, mockSql, mockGetAuthenticatedUserId, mockGetAuthenticatedUser, mockSendCreatorRequestToAdmin, mockSendCreatorApprovalEmail, mockSendCreatorSubmissionConfirmationEmail } = vi.hoisted(() => {
  const state = {
    request: null as null | {
      id: string
      user_id: string
      full_name: string
      email: string
      presentation: string
      motivation: string
      portfolio_url: string | null
      status: string
      created_at: string
    },
    user: { id: "user-1", is_creator: false },
  }

  const mockSql = vi.fn(async (query: string, params?: unknown[]) => {
  if (query.includes("SELECT id, status FROM creator_requests WHERE user_id")) {
    return state.request ? [{ id: state.request.id, status: state.request.status }] : []
  }

  if (query.includes("INSERT INTO creator_requests")) {
    state.request = {
      id: "req-1",
      user_id: params?.[0] as string,
      full_name: params?.[1] as string,
      email: params?.[2] as string,
      presentation: params?.[3] as string,
      motivation: params?.[4] as string,
      portfolio_url: (params?.[5] as string) || null,
      status: "pending",
      created_at: "2026-01-01T00:00:00.000Z",
    }
    return [state.request]
  }

  if (query.includes("SELECT user_id, email, full_name FROM creator_requests WHERE id")) {
    return state.request ? [{ user_id: state.request.user_id, email: state.request.email, full_name: state.request.full_name }] : []
  }

  if (query.includes("UPDATE creator_requests")) {
    if (state.request) {
      state.request.status = params?.[0] as string
    }
    return []
  }

  if (query.includes("UPDATE users SET is_creator = true")) {
    state.user.is_creator = true
    return []
  }

  return []
  })

  return {
    state,
    mockSql,
    mockGetAuthenticatedUserId: vi.fn(() => "user-1"),
    mockGetAuthenticatedUser: vi.fn(() => ({ id: "admin-1", isAdmin: true })),
    mockSendCreatorRequestToAdmin: vi.fn(() => Promise.resolve({ success: true })),
    mockSendCreatorApprovalEmail: vi.fn(() => Promise.resolve({ success: true })),
    mockSendCreatorSubmissionConfirmationEmail: vi.fn(() => Promise.resolve({ success: true })),
  }
})

vi.mock("@/lib/db", () => ({ default: mockSql }))
vi.mock("@/lib/auth-request", () => ({
  getAuthenticatedUserId: mockGetAuthenticatedUserId,
  getAuthenticatedUser: mockGetAuthenticatedUser,
}))
vi.mock("@/lib/email", () => ({
  sendCreatorRequestToAdmin: mockSendCreatorRequestToAdmin,
  sendCreatorSubmissionConfirmationEmail: mockSendCreatorSubmissionConfirmationEmail,
  sendCreatorApprovalEmail: mockSendCreatorApprovalEmail,
  sendCreatorRejectionEmail: vi.fn(),
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

import { POST as submitCreatorRequest } from "@/app/api/creator-requests/route"
import { PATCH as approveCreatorRequest } from "@/app/api/admin/creator-requests/[id]/route"

describe("creator approval integration flow", () => {
  beforeEach(() => {
    state.request = null
    state.user.is_creator = false
    mockSendCreatorRequestToAdmin.mockClear()
    mockSendCreatorSubmissionConfirmationEmail.mockClear()
    mockSendCreatorApprovalEmail.mockClear()
  })

  it("submits and approves a creator request end-to-end across route handlers", async () => {
    const submitRequest = new NextRequest("http://localhost:3000/api/creator-requests", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Reader One",
        email: "reader@example.com",
        presentation: "a".repeat(55),
        motivation: "b".repeat(55),
      }),
      headers: { "Content-Type": "application/json" },
    })

    const submitResponse = await submitCreatorRequest(submitRequest)
    expect(submitResponse.status).toBe(201)
    expect(state.request?.status).toBe("pending")

    const approveRequest = new NextRequest("http://localhost:3000/api/admin/creator-requests/req-1", {
      method: "PATCH",
      body: JSON.stringify({ action: "approve", adminNotes: "Looks good" }),
      headers: { "Content-Type": "application/json" },
    })

    const approveResponse = await approveCreatorRequest(approveRequest, { params: Promise.resolve({ id: "req-1" }) })
    const approveJson = await approveResponse.json()

    expect(approveResponse.status).toBe(200)
    expect(approveJson.data.message).toContain("maintenant createur")
    expect(state.request?.status).toBe("approved")
    expect(state.user.is_creator).toBe(true)
    expect(mockSendCreatorRequestToAdmin).toHaveBeenCalledOnce()
    expect(mockSendCreatorSubmissionConfirmationEmail).toHaveBeenCalledOnce()
    expect(mockSendCreatorApprovalEmail).toHaveBeenCalledOnce()
  })
})
