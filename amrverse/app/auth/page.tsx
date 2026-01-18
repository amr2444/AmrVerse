"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { SignupForm } from "@/components/auth/signup-form"
import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/logo"

export default function AuthPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isSignup, setIsSignup] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  const handleSuccess = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
        <div
          className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-secondary/15 rounded-full blur-3xl opacity-25 animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center mb-4">
            <Logo size="lg" onClick={() => router.push("/")} />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            {isSignup ? "Join the Manhwa Universe" : "Welcome Back"}
          </h1>
          <p className="text-foreground/60">
            {isSignup ? "Create an account to start reading with friends" : "Sign in to your AmrVerse account"}
          </p>
        </div>

        {/* Auth Forms */}
        <div className="bg-card/40 border border-primary/20 rounded-xl p-8 backdrop-blur-xl">
          {isSignup ? <SignupForm onSuccess={handleSuccess} /> : <LoginForm onSuccess={handleSuccess} />}

          {/* Toggle signup/login */}
          <div className="mt-6 text-center text-sm text-foreground/60">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-primary hover:text-secondary transition-colors font-semibold"
            >
              {isSignup ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
