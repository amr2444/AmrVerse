export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { getUserFromToken, refreshAccessToken } from "@/lib/auth"
import { getAuthenticatedUser } from "@/lib/auth-request"
import { getRefreshTokenFromRequest, setAccessTokenCookie } from "@/lib/auth-cookies"
import type { ApiResponse, User } from "@/lib/types"

interface SessionResponse {
  user: User
  accessToken?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<SessionResponse>>> {
  try {
    let user = await getAuthenticatedUser(request, sql)
    let freshAccessToken: string | undefined

    if (!user) {
      const refreshToken = getRefreshTokenFromRequest(request)
      if (!refreshToken) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      const nextAccessToken = refreshAccessToken(refreshToken)
      if (!nextAccessToken) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      user = await getUserFromToken(nextAccessToken, sql)
      freshAccessToken = nextAccessToken
    }

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName || undefined,
          avatarUrl: user.avatarUrl || undefined,
          bio: user.bio || undefined,
          isCreator: user.isCreator,
          isAdmin: user.isAdmin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken: freshAccessToken,
      },
    })

    if (freshAccessToken) {
      setAccessTokenCookie(response, freshAccessToken)
    }

    return response
  } catch (error) {
    console.error("[v0] Session error:", error)
    return NextResponse.json({ success: false, error: "Failed to load session" }, { status: 500 })
  }
}
