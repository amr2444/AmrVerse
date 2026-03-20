// Authentication login endpoint
// Handles user authentication and JWT token generation
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { generateTokenPair, hashPassword, verifyPasswordWithMigration } from "@/lib/auth"
import { setAuthCookies } from "@/lib/auth-cookies"
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

    // Check if this email should be admin/creator
    const adminEmails = (process.env.ADMIN_EMAIL?.split(",") || ["akef.minato@gmail.com"]).map(e => e.trim().toLowerCase())
    const isAdmin = adminEmails.includes(payload.email.toLowerCase())

    if (isAdmin) {
      await sql(
        `UPDATE users SET is_creator = true, is_admin = true WHERE email = $1 AND (is_creator = false OR is_admin = false)`,
        [payload.email.toLowerCase()]
      )
    }

    // Find user by email
    const [user] = await sql(
      `SELECT id, email, username, password_hash, display_name, avatar_url, bio, is_creator, is_admin, created_at, updated_at 
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

    // Verify password and transparently upgrade legacy hashes on successful login
    const passwordVerification = verifyPasswordWithMigration(payload.password, user.password_hash)

    if (!passwordVerification.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    if (passwordVerification.needsRehash) {
      await sql(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hashPassword(payload.password), user.id])
    }

    // Generate JWT token pair (access + refresh)
    const { accessToken, refreshToken } = generateTokenPair({
        id: user.id,
        email: user.email,
        username: user.username,
        isCreator: user.is_creator,
        isAdmin: user.is_admin,
      })

    // Reset rate limit on successful login
    resetRateLimit(clientIP, "auth")

    const response = NextResponse.json(
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
            isAdmin: user.is_admin,
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

    setAuthCookies(response, { accessToken, refreshToken })
    return response
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
