// Token refresh endpoint
// Handles JWT access token refresh using refresh token
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { refreshAccessToken, verifyRefreshToken } from "@/lib/auth"
import { getRefreshTokenFromRequest, setAccessTokenCookie } from "@/lib/auth-cookies"
import { applyRateLimit, createRateLimitHeaders, getClientIP } from "@/lib/rate-limiter"
import { captureException, logEvent, withRateLimitHeaders } from "@/lib/observability"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ accessToken: string }>>> {
  try {
    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(request, "auth", getClientIP(request))
    if (rateLimitResponse) {
      logEvent({ level: "warn", event: "auth.refresh.rate_limited", request })
      return rateLimitResponse as NextResponse<ApiResponse<{ accessToken: string }>>
    }

    let refreshToken = getRefreshTokenFromRequest(request)

    if (!refreshToken) {
      const body = await request.json().catch(() => null)
      refreshToken = body?.refreshToken || null
    }

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Refresh token is required",
        },
        { status: 400 },
      )
    }

    // Verify the refresh token first
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or expired refresh token",
        },
        { status: 401 },
      )
    }

    // Generate new access token
    const newAccessToken = refreshAccessToken(refreshToken)
    if (!newAccessToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to refresh token",
        },
        { status: 401 },
      )
    }

    const response = NextResponse.json(
      {
        success: true,
        data: {
          accessToken: newAccessToken,
        },
        message: "Token refreshed successfully",
      },
      { status: 200 },
    )

    setAccessTokenCookie(response, newAccessToken)
    logEvent({ event: "auth.refresh.succeeded", request, metadata: { hasCookie: !!refreshToken } })
    return withRateLimitHeaders(response, createRateLimitHeaders(rateLimitResult))
  } catch (error) {
    await captureException({ event: "auth.refresh.failed", request, error })
    return NextResponse.json(
      {
        success: false,
        error: "Token refresh failed",
      },
      { status: 500 },
    )
  }
}
