import { apiGet, apiPost } from "@/lib/api-client"
import type { User } from "@/lib/types"

interface AuthPayload {
  user: User
  accessToken: string
  refreshToken?: string
}

interface SessionPayload {
  user: User
  accessToken?: string
}

export function loadAuthSession() {
  return apiGet<SessionPayload>("/api/auth/session")
}

export function refreshAuthToken() {
  return apiPost<{ accessToken: string }>("/api/auth/refresh")
}

export function loginWithPassword(email: string, password: string) {
  return apiPost<AuthPayload>("/api/auth/login", { email, password })
}

export function signupWithPassword(email: string, username: string, password: string, displayName?: string) {
  return apiPost<AuthPayload>("/api/auth/signup", { email, username, password, displayName })
}

export function logoutSession() {
  return apiPost<null>("/api/auth/logout")
}

export function fetchUserProfile(userId: string) {
  return apiGet<User>(`/api/users/${userId}/profile`)
}
