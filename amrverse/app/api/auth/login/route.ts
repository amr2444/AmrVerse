// Authentication login endpoint
// Handles user authentication and JWT token generation
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { verifyPassword, generateTokenPair } from "@/lib/auth"
import { applyRateLimit, getClientIP, createRateLimitHeaders, resetRateLimit } from "@/lib/rate-limiter"
import type { LoginPayload } from "@/lib/validations"
import type { ApiResponse, User } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>> {
  try {
    // Apply rate limiting for auth endpoints (strict: 5 attempts per 15 min)
    const clientIP = getClientIP(request)
    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(request, "auth")
    
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>
    }

    const payload: LoginPayload = await request.json()

    if (!payload.email || !payload.password) {
      return NextResponse.json(
        {
          success: false,
          error: "Email and password are required",
        },
        { status: 400 },
      )
    }

    // Find user by email
    const [user] = await sql(
      `SELECT id, email, username, password_hash, display_name, avatar_url, bio, is_creator, created_at, updated_at 
       FROM users WHERE email = $1`,
      [payload.email.toLowerCase()],
    )

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Verify password
    if (!verifyPassword(payload.password, user.password_hash)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Generate JWT token pair (access + refresh)
    const { accessToken, refreshToken } = generateTokenPair({
      id: user.id,
      email: user.email,
      username: user.username,
      isCreator: user.is_creator,
    })

    // Reset rate limit on successful login
    resetRateLimit(clientIP, "auth")

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            bio: user.bio,
            isCreator: user.is_creator,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          },
          accessToken,
          refreshToken,
        },
        message: "Login successful",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Login failed",
      },
      { status: 500 },
    )
  }
}
