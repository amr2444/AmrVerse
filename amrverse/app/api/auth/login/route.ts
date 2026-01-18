// Authentication login endpoint
// Handles user authentication and session creation
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { verifyPassword, generateToken } from "@/lib/auth"
import type { LoginPayload } from "@/lib/validations"
import type { ApiResponse, User } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: User; token: string }>>> {
  try {
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

    // Generate session token with userId encoded
    const randomToken = generateToken()
    const sessionToken = Buffer.from(`${user.id}:${randomToken}`).toString("base64")

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
          token: sessionToken,
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
