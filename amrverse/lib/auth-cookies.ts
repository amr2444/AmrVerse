import type { NextRequest, NextResponse } from "next/server"

export const ACCESS_TOKEN_COOKIE_NAME = "amrverse_access_token"
export const REFRESH_TOKEN_COOKIE_NAME = "amrverse_refresh_token"

const ACCESS_TOKEN_MAX_AGE = 15 * 60
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60

function isSecureCookie() {
  return process.env.NODE_ENV === "production"
}

function getCookieDomain() {
  return process.env.AUTH_COOKIE_DOMAIN || undefined
}

function createCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecureCookie(),
    path: "/",
    maxAge,
    domain: getCookieDomain(),
  }
}

export function setAuthCookies(response: NextResponse, tokens: { accessToken: string; refreshToken: string }) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, createCookieOptions(ACCESS_TOKEN_MAX_AGE))
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, createCookieOptions(REFRESH_TOKEN_MAX_AGE))
  return response
}

export function setAccessTokenCookie(response: NextResponse, accessToken: string) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, accessToken, createCookieOptions(ACCESS_TOKEN_MAX_AGE))
  return response
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(ACCESS_TOKEN_COOKIE_NAME, "", { ...createCookieOptions(0), maxAge: 0 })
  response.cookies.set(REFRESH_TOKEN_COOKIE_NAME, "", { ...createCookieOptions(0), maxAge: 0 })
  return response
}

export function getBearerToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  return authHeader.slice(7)
}

export function getAccessTokenFromRequest(request: NextRequest) {
  return getBearerToken(request.headers.get("authorization")) || request.cookies.get(ACCESS_TOKEN_COOKIE_NAME)?.value || null
}

export function getRefreshTokenFromRequest(request: NextRequest) {
  return request.cookies.get(REFRESH_TOKEN_COOKIE_NAME)?.value || null
}
