"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookOpen, Search, LogOut, Heart, User } from "lucide-react"
import { Logo } from "@/components/logo"
import type { Manhwa } from "@/lib/types"

export default function LibraryPage() {
  const router = useRouter()
  const { user, isLoading, logout, isAuthenticated, token } = useAuth()
  const [manhwas, setManhwas] = useState<Manhwa[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isFetching, setIsFetching] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null)

  useEffect(() => {
    // Allow browsing without auth for demo purposes
    fetchManhwas()
  }, [])

  useEffect(() => {
    // Fetch user's favorites when authenticated
    if (isAuthenticated && user?.id && token) {
      fetchFavorites()
    }
  }, [isAuthenticated, user?.id, token])

  const fetchManhwas = async () => {
    try {
      const response = await fetch("/api/manhwas?page=1&pageSize=50")
      const result = await response.json()
      if (result.success) {
        setManhwas(result.data.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch manhwas:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`/api/favorites?userId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setFavorites(new Set(result.data.favorites))
      }
    } catch (error) {
      console.error("[v0] Failed to fetch favorites:", error)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent, manhwaId: string) => {
    e.stopPropagation() // Prevent card click

    if (!isAuthenticated) {
      router.push("/auth")
      return
    }

    setTogglingFavorite(manhwaId)

    try {
      const isFavorite = favorites.has(manhwaId)

      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?userId=${user?.id}&manhwaId=${manhwaId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (response.ok) {
          setFavorites((prev) => {
            const next = new Set(prev)
            next.delete(manhwaId)
            return next
          })
        }
      } else {
        // Add to favorites
        const response = await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user?.id, manhwaId }),
        })
        if (response.ok) {
          setFavorites((prev) => new Set(prev).add(manhwaId))
        }
      }
    } catch (error) {
      console.error("[v0] Failed to toggle favorite:", error)
    } finally {
      setTogglingFavorite(null)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleManhwaClick = (slug: string) => {
    router.push(`/reader/${slug}`)
  }

  // Removed auth check to allow demo browsing

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo onClick={() => router.push("/dashboard")} />

          <div className="flex-1 mx-8 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
              <Input
                type="text"
                placeholder="Search manhwas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/50 border-primary/20 focus:border-primary/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* User Profile Link */}
                <button
                  onClick={() => router.push(`/profile/${user?.id}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-card/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden sm:inline">
                    {user?.displayName || user?.username}
                  </span>
                </button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="gap-2 border-primary/40 hover:bg-red-500/10 text-foreground bg-transparent"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => router.push("/auth")}
                className="gap-2 bg-primary text-white"
              >
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-2">Discover Manhwas</h1>
          <p className="text-foreground/60">Explore thousands of stories and read with friends</p>
        </div>

        {isFetching ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-foreground/60">Loading library...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {manhwas
              .filter((manhwa) => {
                if (!searchQuery.trim()) return true
                const query = searchQuery.toLowerCase()
                return (
                  manhwa.title.toLowerCase().includes(query) ||
                  (manhwa.author && manhwa.author.toLowerCase().includes(query)) ||
                  (manhwa.description && manhwa.description.toLowerCase().includes(query))
                )
              })
              .map((manhwa) => (
              <div
                key={manhwa.id}
                onClick={() => handleManhwaClick(manhwa.slug)}
                className="group cursor-pointer animate-fade-in"
              >
                <div className="relative overflow-hidden rounded-lg border-2 border-primary/30 hover:border-primary/60 transition-all duration-300 h-96 bg-card/20 group-hover:shadow-2xl group-hover:shadow-primary/20 group-hover:scale-105 transform">
                  {manhwa.coverUrl ? (
                    <>
                      <img
                        src={manhwa.coverUrl}
                        alt={manhwa.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent"></div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-card/60 to-card/20">
                      <BookOpen className="w-16 h-16 text-primary/60 group-hover:text-primary transition-colors" />
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(e, manhwa.id)}
                    disabled={togglingFavorite === manhwa.id}
                    className={`absolute top-3 right-3 z-30 p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${
                      favorites.has(manhwa.id)
                        ? "bg-rose-500/90 text-white hover:bg-rose-600"
                        : "bg-black/40 text-white/80 hover:bg-black/60 hover:text-white"
                    } ${togglingFavorite === manhwa.id ? "opacity-50" : "opacity-100"}`}
                  >
                    <Heart
                      className={`w-5 h-5 transition-transform duration-300 ${
                        favorites.has(manhwa.id) ? "fill-current scale-110" : ""
                      } ${togglingFavorite === manhwa.id ? "animate-pulse" : ""}`}
                    />
                  </button>

                  <div className="absolute bottom-16 left-0 right-0 text-center px-4 z-10">
                    <h3 className="text-xl font-bold text-foreground mb-2 drop-shadow-lg">{manhwa.title}</h3>
                    <p className="text-foreground/80 text-sm drop-shadow-md">{manhwa.author || "Unknown Author"}</p>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex gap-2 justify-between z-20">
                    <div className="px-3 py-1 bg-primary/80 backdrop-blur-sm rounded-full text-xs text-primary-foreground font-semibold border border-primary">
                      {manhwa.totalChapters} Chapters
                    </div>
                    <div className="px-3 py-1 bg-accent/80 backdrop-blur-sm rounded-full text-xs text-accent-foreground font-semibold border border-accent">
                      {manhwa.status}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
