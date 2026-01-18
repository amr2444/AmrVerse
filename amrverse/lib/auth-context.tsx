// Client-side authentication context
// Manages user session and auth state

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "./types"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  signup: (email: string, username: string, password: string, displayName?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("amrverse_token")
    const storedUser = localStorage.getItem("amrverse_user")

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

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

      setToken(data.data.token)
      setUser(data.data.user)

      localStorage.setItem("amrverse_token", data.data.token)
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

      setToken(data.data.token)
      setUser(data.data.user)

      localStorage.setItem("amrverse_token", data.data.token)
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
