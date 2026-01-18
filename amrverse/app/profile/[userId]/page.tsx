"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, LogOut, Heart, Edit2, Clock, UserPlus, UserCheck, MessageCircle, Play, Search, X, Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"
import type { UserProfile, Manhwa } from "@/lib/types"

interface ReadingHistory {
  id: string
  manhwaId: string
  manhwaTitle: string
  manhwaCover?: string
  chapterId: string
  chapterNumber: number
  progress: number
  lastReadAt: Date
}

interface Friend {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  status: "pending" | "accepted"
}

type TabType = "favorites" | "history" | "friends"

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [favorites, setFavorites] = useState<Manhwa[]>([])
  const [readingHistory, setReadingHistory] = useState<ReadingHistory[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [isFriend, setIsFriend] = useState(false)
  const [friendRequestSent, setFriendRequestSent] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>("favorites")
  
  // Search users state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null)

  const userId = params.userId as string
  const isOwnProfile = user?.id === userId

  useEffect(() => {
    if (userId) {
      fetchProfile()
      fetchFavorites()
      fetchFriends()
      fetchReadingHistory()
      if (user && !isOwnProfile) {
        checkFriendshipStatus()
      }
    }
  }, [userId, user])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/profile`)
      const result = await response.json()
      if (result.success) {
        setProfile(result.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch profile:", error)
    } finally {
      setIsFetching(false)
    }
  }

  const fetchFavorites = async () => {
    try {
      const response = await fetch(`/api/users/${userId}/favorites`)
      const result = await response.json()
      if (result.success) {
        setFavorites(result.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch favorites:", error)
    }
  }

  const fetchFriends = async () => {
    try {
      const response = await fetch(`/api/friends?userId=${userId}&status=accepted`)
      const result = await response.json()
      if (result.success) {
        setFriends(result.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch friends:", error)
    }
  }

  const fetchReadingHistory = async () => {
    try {
      const response = await fetch(`/api/reading-progress?userId=${userId}`)
      const result = await response.json()
      if (result.success) {
        setReadingHistory(result.data || [])
      }
    } catch (error) {
      console.error("[v0] Failed to fetch reading history:", error)
    }
  }

  const checkFriendshipStatus = async () => {
    if (!user) return
    try {
      // Check if already friends or request pending
      const response = await fetch(`/api/friends?userId=${user.id}`)
      const result = await response.json()
      if (result.success) {
        const friendship = result.data.find((f: Friend) => f.id === userId)
        if (friendship) {
          if (friendship.status === "accepted") {
            setIsFriend(true)
          } else if (friendship.status === "pending") {
            setFriendRequestSent(true)
          }
        }
      }
    } catch (error) {
      console.error("[v0] Failed to check friendship:", error)
    }
  }

  // Fetch pending friend requests for own profile
  useEffect(() => {
    if (isOwnProfile && user) {
      fetchPendingRequests()
    }
  }, [isOwnProfile, user])

  const fetchPendingRequests = async () => {
    try {
      const response = await fetch(`/api/friends?userId=${user?.id}&status=pending`)
      const result = await response.json()
      if (result.success) {
        setPendingRequests(result.data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch pending requests:", error)
    }
  }

  const handleAddFriend = async () => {
    if (!user) return
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({ userId: user.id, friendId: userId }),
      })

      if (response.ok) {
        setFriendRequestSent(true)
      }
    } catch (error) {
      console.error("[v0] Failed to add friend:", error)
    }
  }

  const handleAcceptFriend = async (friendId: string) => {
    if (!user) return
    try {
      const response = await fetch("/api/friends", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({ userId: user.id, friendId, action: "accept" }),
      })

      if (response.ok) {
        setPendingRequests(prev => prev.filter(f => f.id !== friendId))
        fetchFriends()
        fetchProfile() // Refresh friend count
      }
    } catch (error) {
      console.error("[v0] Failed to accept friend:", error)
    }
  }

  const handleRejectFriend = async (friendId: string) => {
    if (!user) return
    try {
      const response = await fetch("/api/friends", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({ userId: user.id, friendId, action: "reject" }),
      })

      if (response.ok) {
        setPendingRequests(prev => prev.filter(f => f.id !== friendId))
      }
    } catch (error) {
      console.error("[v0] Failed to reject friend:", error)
    }
  }

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}&currentUserId=${user?.id}`)
      const result = await response.json()
      if (result.success) {
        setSearchResults(result.data)
      }
    } catch (error) {
      console.error("[v0] Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Add friend from search results
  const handleAddFriendFromSearch = async (friendId: string) => {
    if (!user) return
    
    setAddingFriendId(friendId)
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({ userId: user.id, friendId }),
      })

      if (response.ok) {
        // Remove from search results and show success
        setSearchResults(prev => prev.map(u => 
          u.id === friendId ? { ...u, status: "pending" as const } : u
        ))
      }
    } catch (error) {
      console.error("[v0] Failed to add friend:", error)
    } finally {
      setAddingFriendId(null)
    }
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground/60">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Profile Not Found</h1>
          <Button onClick={() => router.push("/library")} className="mt-4">
            Back to Library
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo onClick={() => router.push("/dashboard")} />

          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2 border-primary/40 hover:bg-red-500/10 text-foreground bg-transparent"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Profile Header */}
      <div className="relative bg-gradient-to-r from-primary/20 to-secondary/20 border-b border-primary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-lg bg-card/50 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl || "/placeholder.svg"}
                  alt={profile.displayName}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-6xl">👤</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-foreground">{profile.displayName || profile.username}</h1>
                <p className="text-foreground/60">@{profile.username}</p>
              </div>

              {profile.bio && <p className="text-foreground/70 max-w-2xl">{profile.bio}</p>}

              <div className="flex gap-6 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {profile.favoriteCount}
                  </p>
                  <p className="text-sm text-foreground/60">Favorites</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                    {profile.friendCount}
                  </p>
                  <p className="text-sm text-foreground/60">Friends</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                    {profile.totalChaptersRead}
                  </p>
                  <p className="text-sm text-foreground/60">Chapters Read</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                {isOwnProfile ? (
                  <Button className="gap-2 bg-primary hover:bg-primary/90 text-white">
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    {isFriend ? (
                      <Button
                        disabled
                        className="gap-2 bg-green-500/20 text-green-400 border border-green-500/40"
                      >
                        <UserCheck className="w-4 h-4" />
                        Amis
                      </Button>
                    ) : friendRequestSent ? (
                      <Button
                        disabled
                        className="gap-2 bg-yellow-500/20 text-yellow-400 border border-yellow-500/40"
                      >
                        <Clock className="w-4 h-4" />
                        Demande envoyée
                      </Button>
                    ) : (
                      <Button
                        onClick={handleAddFriend}
                        className="gap-2 bg-primary hover:bg-primary/90 text-white"
                      >
                        <UserPlus className="w-4 h-4" />
                        Ajouter en ami
                      </Button>
                    )}
                    {isFriend && (
                      <Button
                        onClick={() => router.push("/reading-room/create")}
                        variant="outline"
                        className="gap-2 border-primary/40 hover:bg-primary/10 text-foreground bg-transparent"
                      >
                        <Play className="w-4 h-4" />
                        Inviter à lire
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Friend Requests (own profile only) */}
      {isOwnProfile && pendingRequests.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
            <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Demandes d'amis ({pendingRequests.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between bg-card/50 rounded-lg p-3 border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      {request.avatarUrl ? (
                        <img src={request.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{request.displayName || request.username}</p>
                      <p className="text-xs text-foreground/50">@{request.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAcceptFriend(request.id)} className="bg-green-500 hover:bg-green-600 text-white h-8 px-3">
                      Accepter
                    </Button>
                    <Button size="sm" onClick={() => handleRejectFriend(request.id)} variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 h-8 px-3">
                      Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-primary/20 pb-4">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "favorites"
                ? "bg-primary text-white"
                : "text-foreground/60 hover:text-foreground hover:bg-card/50"
            }`}
          >
            <Heart className="w-4 h-4" />
            Favoris ({favorites.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "history"
                ? "bg-primary text-white"
                : "text-foreground/60 hover:text-foreground hover:bg-card/50"
            }`}
          >
            <Clock className="w-4 h-4" />
            Historique ({readingHistory.length})
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === "friends"
                ? "bg-primary text-white"
                : "text-foreground/60 hover:text-foreground hover:bg-card/50"
            }`}
          >
            <Users className="w-4 h-4" />
            Amis ({friends.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Favorites Tab */}
          {activeTab === "favorites" && (
            <>
              {favorites.length === 0 ? (
                <div className="bg-card/30 border border-primary/20 rounded-lg p-12 text-center">
                  <Heart className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                  <p className="text-foreground/60">Aucun favori pour le moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {favorites.map((manhwa) => (
                    <div 
                      key={manhwa.id} 
                      className="group cursor-pointer"
                      onClick={() => router.push(`/reader/${manhwa.slug}`)}
                    >
                      <div className="relative overflow-hidden rounded-lg border-2 border-primary/20 hover:border-primary/50 transition-all duration-300 aspect-[3/4] bg-gradient-to-br from-card/60 to-card/20 group-hover:shadow-xl group-hover:shadow-primary/20 group-hover:scale-[1.02] transform">
                        {manhwa.coverUrl ? (
                          <img src={manhwa.coverUrl} alt={manhwa.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <h3 className="text-sm font-bold text-white line-clamp-2">{manhwa.title}</h3>
                          <p className="text-xs text-white/60">{manhwa.totalChapters} chapitres</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <>
              {readingHistory.length === 0 ? (
                <div className="bg-card/30 border border-primary/20 rounded-lg p-12 text-center">
                  <Clock className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                  <p className="text-foreground/60">Aucun historique de lecture</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {readingHistory.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center gap-4 bg-card/30 border border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-all cursor-pointer"
                      onClick={() => router.push(`/reader/${item.manhwaId}?chapter=${item.chapterId}`)}
                    >
                      <div className="w-16 h-20 rounded-lg bg-card/50 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.manhwaCover ? (
                          <img src={item.manhwaCover} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-primary/40" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{item.manhwaTitle}</h3>
                        <p className="text-sm text-foreground/60">Chapitre {item.chapterNumber}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 h-2 bg-card/50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-foreground/50">{item.progress}%</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-foreground/40">
                          {new Date(item.lastReadAt).toLocaleDateString('fr-FR')}
                        </p>
                        <Button size="sm" className="mt-2 bg-primary/20 hover:bg-primary/30 text-primary h-8">
                          <Play className="w-3 h-3 mr-1" />
                          Continuer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Friends Tab */}
          {activeTab === "friends" && (
            <div className="space-y-6">
              {/* Search Users Section (only on own profile) */}
              {isOwnProfile && (
                <div className="bg-card/30 border border-primary/20 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Search className="w-5 h-5 text-primary" />
                      Trouver des amis
                    </h3>
                    {showSearch && (
                      <button
                        onClick={() => {
                          setShowSearch(false)
                          setSearchQuery("")
                          setSearchResults([])
                        }}
                        className="text-foreground/50 hover:text-foreground"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {!showSearch ? (
                    <Button
                      onClick={() => setShowSearch(true)}
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Rechercher des utilisateurs
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                        <input
                          type="text"
                          placeholder="Rechercher par nom d'utilisateur..."
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-card/50 border border-primary/20 rounded-xl text-foreground placeholder-foreground/50 focus:border-primary/50 focus:outline-none"
                          autoFocus
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                        )}
                      </div>

                      {/* Search Results */}
                      {searchQuery.length >= 2 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {searchResults.length === 0 && !isSearching ? (
                            <p className="text-center text-foreground/50 py-4">
                              Aucun utilisateur trouvé pour "{searchQuery}"
                            </p>
                          ) : (
                            searchResults.map((searchUser) => {
                              const isAlreadyFriend = friends.some(f => f.id === searchUser.id)
                              const requestSent = searchUser.status === "pending"
                              
                              return (
                                <div
                                  key={searchUser.id}
                                  className="flex items-center gap-3 bg-card/50 border border-primary/10 rounded-lg p-3 hover:border-primary/30 transition-all"
                                >
                                  <div 
                                    className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
                                    onClick={() => router.push(`/profile/${searchUser.id}`)}
                                  >
                                    {searchUser.avatarUrl ? (
                                      <img src={searchUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-xl">👤</span>
                                    )}
                                  </div>
                                  <div 
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => router.push(`/profile/${searchUser.id}`)}
                                  >
                                    <h4 className="font-medium text-foreground truncate">
                                      {searchUser.displayName || searchUser.username}
                                    </h4>
                                    <p className="text-xs text-foreground/50">@{searchUser.username}</p>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {isAlreadyFriend ? (
                                      <span className="text-xs text-green-400 bg-green-500/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <UserCheck className="w-3 h-3" />
                                        Ami
                                      </span>
                                    ) : requestSent ? (
                                      <span className="text-xs text-yellow-400 bg-yellow-500/20 px-3 py-1.5 rounded-full flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Envoyée
                                      </span>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddFriendFromSearch(searchUser.id)}
                                        disabled={addingFriendId === searchUser.id}
                                        className="bg-primary hover:bg-primary/90 text-white h-8 px-3"
                                      >
                                        {addingFriendId === searchUser.id ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <>
                                            <UserPlus className="w-3 h-3 mr-1" />
                                            Ajouter
                                          </>
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}

                      {searchQuery.length > 0 && searchQuery.length < 2 && (
                        <p className="text-center text-foreground/50 text-sm py-2">
                          Tapez au moins 2 caractères pour rechercher
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Friends List */}
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Mes amis ({friends.length})
                </h3>
                
                {friends.length === 0 ? (
                  <div className="bg-card/30 border border-primary/20 rounded-lg p-12 text-center">
                    <Users className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                    <p className="text-foreground/60 mb-2">Aucun ami pour le moment</p>
                    {isOwnProfile && (
                      <p className="text-sm text-foreground/40">
                        Utilisez la recherche ci-dessus pour trouver des amis !
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {friends.map((friend) => (
                      <div 
                        key={friend.id}
                        className="flex items-center gap-4 bg-card/30 border border-primary/20 rounded-lg p-4 hover:border-primary/40 transition-all cursor-pointer"
                        onClick={() => router.push(`/profile/${friend.id}`)}
                      >
                        <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {friend.avatarUrl ? (
                            <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground truncate">{friend.displayName || friend.username}</h3>
                          <p className="text-sm text-foreground/50">@{friend.username}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-primary/40 hover:bg-primary/10 text-foreground bg-transparent flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/profile/${friend.id}`)
                          }}
                        >
                          Voir profil
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
