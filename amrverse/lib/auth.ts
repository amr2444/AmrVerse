// Authentication utilities
// Handles password hashing, JWT token management, and session security

import crypto from "crypto"
import jwt from "jsonwebtoken"

// ============================================================================
// CONFIGURATION
// ============================================================================

// JWT secret - Uses NEXTAUTH_SECRET as primary secret for compatibility
// Falls back to JWT_SECRET if NEXTAUTH_SECRET is not available
const JWT_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex")

// Separate secret for refresh tokens (more secure to have different secrets)
// If not set, derives from JWT_SECRET with a suffix (not ideal but functional)
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || `${JWT_SECRET}_refresh_token_secret`

// Token expiration times
const ACCESS_TOKEN_EXPIRY = "15m" // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d" // 7 days

// PBKDF2 configuration - 100,000 iterations as recommended by OWASP
const PBKDF2_ITERATIONS = 100000
const LEGACY_PBKDF2_ITERATIONS = 1000
const PBKDF2_KEYLEN = 64
const PBKDF2_DIGEST = "sha512"

// Warn if using default secrets in production
if (process.env.NODE_ENV === "production" && !process.env.NEXTAUTH_SECRET && !process.env.JWT_SECRET) {
  console.error("⚠️ SECURITY WARNING: Neither NEXTAUTH_SECRET nor JWT_SECRET is set in production!")
}

// Recommend setting JWT_REFRESH_SECRET for better security
if (process.env.NODE_ENV === "production" && !process.env.JWT_REFRESH_SECRET) {
  console.warn("⚠️ SECURITY NOTE: JWT_REFRESH_SECRET not set. Using derived secret. Consider setting a unique value.")
}

// ============================================================================
// TYPES
// ============================================================================

export interface JWTPayload {
  userId: string
  email: string
  username: string
  isCreator: boolean
  isAdmin: boolean
  type: "access" | "refresh"
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface PasswordVerificationResult {
  isValid: boolean
  needsRehash: boolean
}

export interface AdminActionPayload {
  requestId: string
  action: "approve" | "reject"
  type: "admin-action"
}

export interface AuthenticatedUser {
  id: string
  email: string
  username: string
  displayName: string | null
  avatarUrl: string | null
  bio: string | null
  isCreator: boolean
  isAdmin: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// PASSWORD HASHING (PBKDF2 with 100,000 iterations)
// ============================================================================

/**
 * Hash password using PBKDF2 with secure configuration
 * Uses 100,000 iterations as recommended by OWASP for SHA-512
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(32).toString("hex")
  const hash = createPasswordHash(password, salt, PBKDF2_ITERATIONS)
  return `${salt}:${hash}`
}

function createPasswordHash(password: string, salt: string, iterations: number): string {
  return crypto.pbkdf2Sync(password, salt, iterations, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString("hex")
}

function compareHash(password: string, salt: string, originalHash: string, iterations: number): boolean {
  const hashToVerify = createPasswordHash(password, salt, iterations)

  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(hashToVerify, "hex"))
}

export function verifyPasswordWithMigration(password: string, storedHash: string): PasswordVerificationResult {
  try {
    const [salt, originalHash] = storedHash.split(":")
    if (!salt || !originalHash) {
      return { isValid: false, needsRehash: false }
    }

    if (compareHash(password, salt, originalHash, PBKDF2_ITERATIONS)) {
      return { isValid: true, needsRehash: false }
    }

    if (compareHash(password, salt, originalHash, LEGACY_PBKDF2_ITERATIONS)) {
      return { isValid: true, needsRehash: true }
    }

    return { isValid: false, needsRehash: false }
  } catch (error) {
    console.error("Password verification error:", error)
    return { isValid: false, needsRehash: false }
  }
}

/**
 * Verify password against stored hash using constant-time comparison
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  return verifyPasswordWithMigration(password, storedHash).isValid
}

// ============================================================================
// JWT TOKEN MANAGEMENT
// ============================================================================

/**
 * Generate a pair of JWT tokens (access + refresh)
 */
export function generateTokenPair(user: {
  id: string
  email: string
  username: string
  isCreator: boolean
  isAdmin: boolean
}): TokenPair {
  const accessPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    isCreator: user.isCreator,
    isAdmin: user.isAdmin,
    type: "access"
  }

  const refreshPayload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    isCreator: user.isCreator,
    isAdmin: user.isAdmin,
    type: "refresh"
  }

  const accessToken = jwt.sign(accessPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: "HS256"
  })

  const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: "HS256"
  })

  return { accessToken, refreshToken }
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"]
    }) as JWTPayload

    if (decoded.type !== "access") {
      return null
    }

    return decoded
  } catch (error) {
    // Token expired, invalid signature, or malformed
    return null
  }
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      algorithms: ["HS256"]
    }) as JWTPayload

    if (decoded.type !== "refresh") {
      return null
    }

    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Refresh an access token using a valid refresh token
 */
export function refreshAccessToken(refreshToken: string): string | null {
  const payload = verifyRefreshToken(refreshToken)
  if (!payload) return null

  const newAccessPayload: JWTPayload = {
    userId: payload.userId,
    email: payload.email,
    username: payload.username,
    isCreator: payload.isCreator,
    isAdmin: payload.isAdmin,
    type: "access"
  }

  return jwt.sign(newAccessPayload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    algorithm: "HS256"
  })
}

// ============================================================================
// LEGACY TOKEN SUPPORT (for backward compatibility during migration)
// ============================================================================

/**
 * Generate secure random token for misc purposes (invites, etc.)
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

export function generateAdminActionToken(payload: Omit<AdminActionPayload, "type">): string {
  return jwt.sign(
    {
      ...payload,
      type: "admin-action",
    },
    JWT_SECRET,
    {
      expiresIn: "1h",
      algorithm: "HS256",
    },
  )
}

export function verifyAdminActionToken(token: string): AdminActionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as AdminActionPayload

    if (decoded.type !== "admin-action") {
      return null
    }

    return decoded
  } catch {
    return null
  }
}

// ============================================================================
// SECURE RANDOM GENERATION
// ============================================================================

/**
 * Generate cryptographically secure room code (8 alphanumeric characters)
 * Uses crypto.randomBytes instead of Math.random()
 */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const randomBytes = crypto.randomBytes(8)
  let code = ""
  
  for (let i = 0; i < 8; i++) {
    // Use modulo to map random byte to character index
    code += chars.charAt(randomBytes[i] % chars.length)
  }
  
  return code
}

// ============================================================================
// USER EXTRACTION FROM TOKEN
// ============================================================================

/**
 * Extract user from JWT token and verify against database
 * This is the secure replacement for the old base64 token system
 */
export async function getUserFromToken(
  token: string, 
  db: (query: string, params: unknown[]) => Promise<unknown[]>
): Promise<AuthenticatedUser | null> {
  try {
    // Verify the JWT token
    const payload = verifyAccessToken(token)
    if (!payload) return null

    // Fetch fresh user data from database
    const [user] = await db(
      `SELECT id, email, username, display_name, avatar_url, bio, is_creator, is_admin, created_at, updated_at 
       FROM users WHERE id = $1`,
      [payload.userId]
    ) as any[]

    if (!user) return null

    return {
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
    }
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}

/**
 * Extract user ID from token without database lookup
 * Useful for quick authorization checks
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = verifyAccessToken(token)
  return payload?.userId || null
}

// ============================================================================
// REQUEST AUTHENTICATION HELPER
// ============================================================================

/**
 * Extract and verify token from Authorization header
 * Returns the authenticated user or null
 */
export async function authenticateRequest(
  authHeader: string | null,
  db: (query: string, params: unknown[]) => Promise<unknown[]>
): Promise<AuthenticatedUser | null> {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.slice(7) // Remove "Bearer " prefix
  return getUserFromToken(token, db)
}
