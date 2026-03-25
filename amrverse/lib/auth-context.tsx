// Client-side authentication context
// Manages session state backed by secure httpOnly cookies

"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User } from "./types"
import { fetchUserProfile, loadAuthSession, loginWithPassword, logoutSession, refreshAuthToken, signupWithPassword } from "@/lib/services/auth-client"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  signup: (email: string, username: string, password: string, displayName?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
  refreshToken: () => Promise<boolean>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token refresh interval (14 minutes - before 15min access token expiry)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)

    void logoutSession().catch((error) => {
      console.error("Logout error:", error)
    })
  }, [])

  const loadSession = useCallback(async () => {
    try {
      const response = await loadAuthSession()
      setUser(response.data.user)
      setToken(response.data.accessToken || null)
    } catch (error) {
      console.error("Session load error:", error)
      setUser(null)
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await refreshAuthToken()
      setToken(response.data.accessToken)
      return true
    } catch (error) {
      console.error("Token refresh error:", error)
      logout()
      return false
    }
  }, [logout])

  useEffect(() => {
    void loadSession()
  }, [loadSession])

  // Set up automatic token refresh
  useEffect(() => {
    if (!token) return

    // Refresh token periodically
    const intervalId = setInterval(() => {
      refreshToken()
    }, TOKEN_REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [token, refreshToken])

  const signup = async (email: string, username: string, password: string, displayName?: string) => {
    setIsLoading(true)
    try {
      const response = await signupWithPassword(email, username, password, displayName)
      setToken(response.data.accessToken)
      setUser(response.data.user)
    } catch (error) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await loginWithPassword(email, password)
      setToken(response.data.accessToken)
      setUser(response.data.user)
    } catch (error) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh user profile from the server
  const refreshUser = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetchUserProfile(user.id)
      setUser(response.data)
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signup,
        login,
        logout,
        isAuthenticated: !!user,
        refreshToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
