"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, LogOut, Plus, Heart, Clock, Play, ArrowRight, User } from "lucide-react"
import { Logo } from "@/components/logo"
import type { Manhwa, ReadingRoom } from "@/lib/types"

interface ReadingHistoryItem {
  manhwaId: string
  manhwaTitle: string
  manhwaSlug: string
  manhwaCoverUrl: string | null
  chapterId: string
  chapterNumber: number
  chapterTitle: string | null
  lastPageRead: number
  totalPages: number
  completed: boolean
  lastReadAt: string
}

interface DashboardData {
  readingHistory: ReadingHistoryItem[]
  favorites: Manhwa[]
  activeRooms: (ReadingRoom & { manhwaTitle: string; manhwaCoverUrl: string | null; participantCount: number })[]
  stats: {
    totalChaptersRead: number
    totalFavorites: number
    activeRoomsCount: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading, logout, isAuthenticated, token } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth")
    }
  }, [isLoading, isAuthenticated, router])

  useEffect(() => {
    if (isAuthenticated && user?.id && token) {
      fetchDashboardData()
    }
  }, [isAuthenticated, user?.id, token])

  const fetchDashboardData = async () => {
    try {
      setIsFetching(true)
      const response = await fetch(`/api/dashboard?userId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const result = await response.json()
      if (result.success) {
        setDashboardData(result.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard data:", error)
    } finally {
      setIsFetching(false)
    }
  }

  if (!isLoading && !isAuthenticated) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground/60">Loading your library...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo onClick={() => router.push("/dashboard")} />

          <div className="flex items-center gap-4">
            {/* User Profile Link */}
            <button
              onClick={() => router.push(`/profile/${user?.id}`)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card/50 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user?.displayName || user?.username}</p>
                <p className="text-xs text-foreground/60">Voir mon profil</p>
              </div>
            </button>

            {/* Join Room Button */}
            <Button
              onClick={() => router.push("/reading-room/create")}
              className="gap-2 bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-white"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Rejoindre une Room</span>
            </Button>

            {user?.isCreator && (
              <Button
                onClick={() => router.push("/admin/upload-content")}
                variant="outline"
                className="gap-2 border-primary/40 hover:bg-primary/10 text-primary bg-transparent"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Portail Créateur</span>
              </Button>
            )}
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 border-primary/40 hover:bg-red-500/10 text-foreground bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-card/60 to-card/30 border border-primary/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <p className="text-foreground/60 text-sm">Chapters Read</p>
                <p className="text-2xl font-bold text-foreground">
                  {isFetching ? "..." : dashboardData?.stats.totalChaptersRead || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-card/60 to-card/30 border border-secondary/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-secondary" />
              <div>
                <p className="text-foreground/60 text-sm">Active Rooms</p>
                <p className="text-2xl font-bold text-foreground">
                  {isFetching ? "..." : dashboardData?.stats.activeRoomsCount || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-card/60 to-card/30 border border-accent/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <Heart className="w-8 h-8 text-accent" />
              <div>
                <p className="text-foreground/60 text-sm">Favorites</p>
                <p className="text-2xl font-bold text-foreground">
                  {isFetching ? "..." : dashboardData?.stats.totalFavorites || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Reading Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Continue Reading
            </h2>
            {dashboardData?.readingHistory && dashboardData.readingHistory.length > 0 && (
              <Button
                variant="ghost"
                className="text-primary hover:text-primary/80"
                onClick={() => router.push("/library")}
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : dashboardData?.readingHistory && dashboardData.readingHistory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.readingHistory.slice(0, 6).map((item) => (
                <div
                  key={`${item.manhwaId}-${item.chapterId}`}
                  onClick={() => router.push(`/reader/${item.manhwaSlug}`)}
                  className="group cursor-pointer bg-card/40 border border-primary/20 rounded-xl p-4 hover:border-primary/50 hover:bg-card/60 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-primary/10 flex-shrink-0">
                      {item.manhwaCoverUrl ? (
                        <img
                          src={item.manhwaCoverUrl}
                          alt={item.manhwaTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {item.manhwaTitle}
                      </h3>
                      <p className="text-sm text-foreground/60">
                        Chapter {item.chapterNumber}
                        {item.chapterTitle && `: ${item.chapterTitle}`}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                            style={{ width: `${(item.lastPageRead / item.totalPages) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-foreground/50">
                          {item.lastPageRead}/{item.totalPages}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/40 mt-1">{formatTimeAgo(item.lastReadAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card/20 border border-primary/10 rounded-xl p-8 text-center">
              <BookOpen className="w-12 h-12 text-primary/30 mx-auto mb-4" />
              <p className="text-foreground/60">No reading history yet</p>
              <Button
                onClick={() => router.push("/library")}
                className="mt-4 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
              >
                Start Reading
              </Button>
            </div>
          )}
        </section>

        {/* Active Rooms Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-secondary" />
              Active Reading Rooms
            </h2>
            <Button
              onClick={() => router.push("/reading-room/create")}
              variant="outline"
              className="gap-2 border-secondary/40 hover:bg-secondary/10 text-secondary bg-transparent"
            >
              <Plus className="w-4 h-4" />
              Rejoindre / Créer
            </Button>
          </div>

          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : dashboardData?.activeRooms && dashboardData.activeRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.activeRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => router.push(`/reading-room/${room.code}`)}
                  className="group cursor-pointer bg-card/40 border border-secondary/20 rounded-xl p-4 hover:border-secondary/50 hover:bg-card/60 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-secondary/10 flex-shrink-0">
                      {room.manhwaCoverUrl ? (
                        <img
                          src={room.manhwaCoverUrl}
                          alt={room.manhwaTitle}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-secondary/50" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-secondary transition-colors">
                        {room.roomName || "Reading Room"}
                      </h3>
                      <p className="text-sm text-foreground/60 truncate">{room.manhwaTitle}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex items-center gap-1 text-xs text-secondary">
                          <Users className="w-3 h-3" />
                          <span>{room.participantCount}/{room.maxParticipants}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                          Live
                        </span>
                      </div>
                      <p className="text-xs text-foreground/40 mt-1">Code: {room.code}</p>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-3 bg-gradient-to-r from-secondary to-primary hover:opacity-90 text-white gap-2"
                    size="sm"
                  >
                    <Play className="w-3 h-3" /> Join Room
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card/20 border border-secondary/10 rounded-xl p-8 text-center">
              <Users className="w-12 h-12 text-secondary/30 mx-auto mb-4" />
              <p className="text-foreground/60">No active reading rooms</p>
              <p className="text-foreground/40 text-sm mt-1">Create a room while reading to invite friends!</p>
            </div>
          )}
        </section>

        {/* Favorites Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Heart className="w-6 h-6 text-accent" />
              Your Favorites
            </h2>
            {dashboardData?.favorites && dashboardData.favorites.length > 0 && (
              <Button
                variant="ghost"
                className="text-accent hover:text-accent/80"
                onClick={() => router.push("/library")}
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {isFetching ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : dashboardData?.favorites && dashboardData.favorites.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {dashboardData.favorites.slice(0, 5).map((manhwa) => (
                <div
                  key={manhwa.id}
                  onClick={() => router.push(`/reader/${manhwa.slug}`)}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden border-2 border-accent/30 hover:border-accent/60 transition-all duration-300 group-hover:scale-105 transform">
                    {manhwa.coverUrl ? (
                      <img
                        src={manhwa.coverUrl}
                        alt={manhwa.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-card/60 to-card/20 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-accent/50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-semibold text-foreground text-sm truncate">{manhwa.title}</h3>
                      <p className="text-xs text-foreground/60">{manhwa.totalChapters} chapters</p>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Heart className="w-5 h-5 text-accent fill-accent" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card/20 border border-accent/10 rounded-xl p-8 text-center">
              <Heart className="w-12 h-12 text-accent/30 mx-auto mb-4" />
              <p className="text-foreground/60">No favorites yet</p>
              <Button
                onClick={() => router.push("/library")}
                className="mt-4 bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white"
              >
                Explore Library
              </Button>
            </div>
          )}
        </section>

        {/* CTA for library */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/40 rounded-xl p-8 text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Discover More Manhwas</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Explore our library of thousands of manhwas, create reading rooms with friends, and experience synchronized
            storytelling like never before.
          </p>
          <Button 
            onClick={() => router.push("/library")}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold gap-2"
          >
            <Plus className="w-5 h-5" />
            Explore Library
          </Button>
        </div>

        {/* Creator CTA - Only shown for creators */}
        {user?.isCreator && (
          <div className="bg-gradient-to-r from-accent/20 to-primary/20 border border-accent/40 rounded-xl p-8 text-center space-y-4 mt-6">
            <h2 className="text-3xl font-bold text-foreground">Portail Créateur</h2>
            <p className="text-foreground/70 max-w-2xl mx-auto">
              Téléchargez vos manhwas, gérez vos chapitres et partagez vos créations avec la communauté.
            </p>
            <Button 
              onClick={() => router.push("/admin/upload-content")}
              className="bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white font-semibold gap-2"
            >
              <Plus className="w-5 h-5" />
              Uploader un Manhwa
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
