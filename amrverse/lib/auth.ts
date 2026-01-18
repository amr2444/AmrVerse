// Authentication utilities
// Handles password hashing and session management

import crypto from "crypto"

/**
 * Hash password using PBKDF2 (suitable for production with proper salt)
 * For production, consider using bcrypt or argon2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

/**
 * Verify password against hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  const [salt, original] = hash.split(":")
  const hashVerify = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return hashVerify === original
}

/**
 * Generate secure random token for sessions/invites
 */
export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

/**
 * Generate short room code (8 alphanumeric characters)
 */
export function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Simple token verification (Note: In production use proper JWT)
 * For now, tokens are stored in localStorage and validated against DB
 */
export async function getUserFromToken(token: string, db: any): Promise<any | null> {
  try {
    // For demo purposes, we assume token format: "userid:randomtoken"
    // In production, use proper JWT with signing
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const [userId] = decoded.split(":")
    
    if (!userId) return null

    const [user] = await db(
      "SELECT id, email, username, display_name, avatar_url, is_creator FROM users WHERE id = $1",
      [userId]
    )

    return user || null
  } catch (error) {
    console.error("Token verification error:", error)
    return null
  }
}
