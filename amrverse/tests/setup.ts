import { afterEach, beforeEach, vi } from "vitest"

beforeEach(() => {
  process.env.JWT_SECRET = "test-jwt-secret"
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret"
  process.env.NEXTAUTH_SECRET = "test-nextauth-secret"
  process.env.NEXTAUTH_URL = "http://localhost:3000"
  process.env.ADMIN_EMAIL = "akef.minato@gmail.com"
})

afterEach(() => {
  vi.clearAllMocks()
  vi.restoreAllMocks()
})
