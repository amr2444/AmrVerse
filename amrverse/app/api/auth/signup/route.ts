// Authentication signup endpoint
// Handles user registration with validation and password hashing
export const runtime = "nodejs"

import { type NextRequest, NextResponse } from "next/server"
import sql from "@/lib/db"
import { hashPassword, generateTokenPair } from "@/lib/auth"
import { applyRateLimit, getClientIP } from "@/lib/rate-limiter"
import { validateSignup, type SignupPayload } from "@/lib/validations"
import type { ApiResponse, User } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>> {
  try {
    // Apply rate limiting for auth endpoints (strict: 5 attempts per 15 min)
    const { result: rateLimitResult, response: rateLimitResponse } = applyRateLimit(request, "auth")
    
    if (rateLimitResponse) {
      return rateLimitResponse as NextResponse<ApiResponse<{ user: User; accessToken: string; refreshToken: string }>>
    }

    const payload: SignupPayload = await request.json()

    // Validate input
    const validationErrors = validateSignup(payload)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: validationErrors.join(", "),
        },
        { status: 400 },
      )
    }

    // Check if email already exists
    const existingEmail = await sql("SELECT id FROM users WHERE email = $1 LIMIT 1", [
      payload.email.toLowerCase(),
    ])

    if (existingEmail.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "email already in use",
        },
        { status: 409 },
      )
    }

    // Check if username already exists
    const existingUsername = await sql("SELECT id FROM users WHERE username = $1 LIMIT 1", [
      payload.username,
    ])

    if (existingUsername.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Username already exists",
        },
        { status: 409 },
      )
    }

    // Hash password with secure PBKDF2 (100,000 iterations)
    const passwordHash = hashPassword(payload.password)

    // Create user
    const result = await sql(
      `INSERT INTO users (email, username, password_hash, display_name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, username, display_name, avatar_url, bio, is_creator, created_at, updated_at`,
      [payload.email.toLowerCase(), payload.username, passwordHash, payload.displayName || payload.username],
    )

    if (!result || result.length === 0) {
      throw new Error("Failed to create user account")
    }

    const newUser = result[0]

    // Generate JWT token pair (access + refresh)
    const { accessToken, refreshToken } = generateTokenPair({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
      isCreator: newUser.is_creator,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
            displayName: newUser.display_name,
            avatarUrl: newUser.avatar_url,
            bio: newUser.bio,
            isCreator: newUser.is_creator,
            createdAt: newUser.created_at,
            updatedAt: newUser.updated_at,
          },
          accessToken,
          refreshToken,
        },
        message: "Account created successfully",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Signup error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to create account"
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    )
  }
}
