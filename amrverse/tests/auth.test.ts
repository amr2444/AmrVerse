import test from "node:test"
import assert from "node:assert/strict"

import { generateAdminActionToken, verifyAdminActionToken } from "../lib/auth.ts"
import { getBearerToken } from "../lib/auth-cookies.ts"

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
