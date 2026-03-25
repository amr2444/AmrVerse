import crypto from "node:crypto"
import { describe, expect, it } from "vitest"

import {
  generateAdminActionToken,
  hashPassword,
  verifyAdminActionToken,
  verifyPassword,
  verifyPasswordWithMigration,
} from "../lib/auth"
import { getBearerToken } from "../lib/auth-cookies"

function createLegacyPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

describe("auth helpers", () => {
  it("extracts bearer tokens", () => {
    expect(getBearerToken("Bearer abc123")).toBe("abc123")
    expect(getBearerToken("Basic abc123")).toBeNull()
    expect(getBearerToken(null)).toBeNull()
  })

  it("round-trips admin action tokens", () => {
    const token = generateAdminActionToken({ requestId: "req_123", action: "approve" })
    const payload = verifyAdminActionToken(token)

    expect(payload).toMatchObject({ requestId: "req_123", action: "approve", type: "admin-action" })
  })

  it("rejects tampered admin action tokens", () => {
    const token = generateAdminActionToken({ requestId: "req_123", action: "reject" })
    expect(verifyAdminActionToken(`${token}tampered`)).toBeNull()
  })

  it("accepts hashes generated with the current format", () => {
    const password = "CorrectHorseBatteryStaple123!"
    const hash = hashPassword(password)

    expect(verifyPassword(password, hash)).toBe(true)
    expect(verifyPasswordWithMigration(password, hash)).toEqual({
      isValid: true,
      needsRehash: false,
    })
  })

  it("accepts legacy hashes and flags them for rehash", () => {
    const password = "LegacyPassword123!"
    const legacyHash = createLegacyPasswordHash(password)

    expect(verifyPassword(password, legacyHash)).toBe(true)
    expect(verifyPasswordWithMigration(password, legacyHash)).toEqual({
      isValid: true,
      needsRehash: true,
    })
  })
})
