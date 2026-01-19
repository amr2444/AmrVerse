// Token refresh endpoint
// Handles JWT access token refresh using refresh token
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import { refreshAccessToken, verifyRefreshToken } from "@/lib/auth"
import type { ApiResponse } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ accessToken: string }>>> {
  try {
    const { refreshToken } = await request.json()

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

    return NextResponse.json(
      {
        success: true,
        data: {
          accessToken: newAccessToken,
        },
        message: "Token refreshed successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Token refresh error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Token refresh failed",
      },
      { status: 500 },
    )
  }
}
