// Client-side authentication context
// Manages user session and auth state with JWT tokens

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Token refresh interval (14 minutes - before 15min access token expiry)
const TOKEN_REFRESH_INTERVAL = 14 * 60 * 1000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Refresh the access token using the refresh token
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const storedRefreshToken = localStorage.getItem("amrverse_refresh_token")
      if (!storedRefreshToken) return false

      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      })

      if (!response.ok) {
        // Refresh token expired or invalid - logout user
        logout()
        return false
      }

      const data = await response.json()
      if (data.success && data.data.accessToken) {
        setToken(data.data.accessToken)
        localStorage.setItem("amrverse_token", data.data.accessToken)
        return true
      }

      return false
    } catch (error) {
      console.error("Token refresh error:", error)
      return false
    }
  }, [])

  // Load session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("amrverse_token")
    const storedUser = localStorage.getItem("amrverse_user")

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        // Invalid stored data - clear it
        localStorage.removeItem("amrverse_token")
        localStorage.removeItem("amrverse_refresh_token")
        localStorage.removeItem("amrverse_user")
      }
    }

    setIsLoading(false)
  }, [])

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

      // Store JWT tokens
      setToken(data.data.accessToken)
      setUser(data.data.user)

      localStorage.setItem("amrverse_token", data.data.accessToken)
      localStorage.setItem("amrverse_refresh_token", data.data.refreshToken)
      localStorage.setItem("amrverse_user", JSON.stringify(data.data.user))
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

      // Store JWT tokens
      setToken(data.data.accessToken)
      setUser(data.data.user)

      localStorage.setItem("amrverse_token", data.data.accessToken)
      localStorage.setItem("amrverse_refresh_token", data.data.refreshToken)
      localStorage.setItem("amrverse_user", JSON.stringify(data.data.user))
    } catch (error) {
      setIsLoading(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem("amrverse_token")
    localStorage.removeItem("amrverse_refresh_token")
    localStorage.removeItem("amrverse_user")
  }

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
