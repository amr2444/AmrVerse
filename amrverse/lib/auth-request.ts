import type { NextRequest } from "next/server"
import type { AuthenticatedUser } from "@/lib/auth"
import { getUserFromToken, getUserIdFromToken } from "@/lib/auth"
import { getAccessTokenFromRequest } from "@/lib/auth-cookies"

type QueryFn = (query: string, params?: unknown[]) => Promise<unknown[]>

export function getAuthenticatedToken(request: NextRequest) {
  return getAccessTokenFromRequest(request)
}

export function getAuthenticatedUserId(request: NextRequest) {
  const token = getAuthenticatedToken(request)
  if (!token) {
    return null
  }

  return getUserIdFromToken(token)
}

export async function getAuthenticatedUser(request: NextRequest, db: QueryFn): Promise<AuthenticatedUser | null> {
  const token = getAuthenticatedToken(request)
  if (!token) {
    return null
  }

  return getUserFromToken(token, db)
}
