// Client-side authentication context
// Manages session state backed by secure httpOnly cookies

"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User } from "./types"

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

    void fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    }).catch((error) => {
      console.error("Logout error:", error)
    })
  }, [])

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      })

      if (!response.ok) {
        setUser(null)
        setToken(null)
        return
      }

      const data = await response.json()
      if (data.success && data.data?.user) {
        setUser(data.data.user)
        setToken(data.data.accessToken || null)
      }
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
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      })

      if (!response.ok) {
        logout()
        return false
      }

      const data = await response.json()
      if (data.success && data.data.accessToken) {
        setToken(data.data.accessToken)
        return true
      }

      return false
    } catch (error) {
      console.error("Token refresh error:", error)
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password, displayName }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error("Failed to parse server response")
      }

      if (!response.ok) {
        throw new Error(data.error || "Signup failed")
      }

      setToken(data.data.accessToken)
      setUser(data.data.user)
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
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      })

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        throw new Error("Failed to parse server response")
      }

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      setToken(data.data.accessToken)
      setUser(data.data.user)
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
      const response = await fetch(`/api/users/${user.id}/profile`, { credentials: "include" })

      if (!response.ok) return

      const data = await response.json()
      if (data.success && data.data) {
        setUser(data.data)
      }
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
