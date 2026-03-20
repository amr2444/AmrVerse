import test from "node:test"
import assert from "node:assert/strict"
import crypto from "node:crypto"

import { generateAdminActionToken, hashPassword, verifyAdminActionToken, verifyPassword, verifyPasswordWithMigration } from "../lib/auth.ts"
import { getBearerToken } from "../lib/auth-cookies.ts"

function createLegacyPasswordHash(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

test("getBearerToken extracts bearer tokens", () => {
  assert.equal(getBearerToken("Bearer abc123"), "abc123")
  assert.equal(getBearerToken("Basic abc123"), null)
  assert.equal(getBearerToken(null), null)
})

test("admin action tokens round-trip correctly", () => {
  const token = generateAdminActionToken({
    requestId: "req_123",
    action: "approve",
  })

  const payload = verifyAdminActionToken(token)

  assert.ok(payload)
  assert.equal(payload?.requestId, "req_123")
  assert.equal(payload?.action, "approve")
  assert.equal(payload?.type, "admin-action")
})

test("admin action token verification rejects tampering", () => {
  const token = generateAdminActionToken({
    requestId: "req_123",
    action: "reject",
  })

  const tampered = `${token}tampered`

  assert.equal(verifyAdminActionToken(tampered), null)
})

test("verifyPassword accepts hashes generated with the current format", () => {
  const password = "CorrectHorseBatteryStaple123!"
  const hash = hashPassword(password)

  assert.equal(verifyPassword(password, hash), true)
  assert.deepEqual(verifyPasswordWithMigration(password, hash), {
    isValid: true,
    needsRehash: false,
  })
})

test("verifyPasswordWithMigration accepts legacy hashes and flags them for rehash", () => {
  const password = "LegacyPassword123!"
  const legacyHash = createLegacyPasswordHash(password)

  assert.equal(verifyPassword(password, legacyHash), true)
  assert.deepEqual(verifyPasswordWithMigration(password, legacyHash), {
    isValid: true,
    needsRehash: true,
  })
})
