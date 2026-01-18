"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { VerticalScrollReader } from "@/components/vertical-scroll-reader"
import { LogOut, Users, Send, MessageCircle, Copy, Check, BookOpen, Radio, Crown, Link2, Unlink, Trash2 } from "lucide-react"
import { Logo } from "@/components/logo"
import type { ChapterPage, PanelComment, ReadingRoom } from "@/lib/types"

interface RoomParticipant {
  id: string
  roomId: string
  userId: string
  // injected by API for UI convenience
  username?: string
  joinedAt?: string
  lastSeen?: string
}

interface Message {
  id: string
  userId: string
  username: string
  message: string
  timestamp: Date
}

export default function ReadingRoomPage() {
  const router = useRouter()
  const params = useParams()
  const { user, logout } = useAuth()

  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [messageInput, setMessageInput] = useState("")
  const [room, setRoom] = useState<ReadingRoom | null>(null)
  const [isRoomLoading, setIsRoomLoading] = useState(true)
  const [isChatPolling, setIsChatPolling] = useState(false)
  const [pages, setPages] = useState<ChapterPage[]>([])
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [panelComments, setPanelComments] = useState<PanelComment[]>([])
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [commentModeEnabled, setCommentModeEnabled] = useState(false)
  
  // Sync mode state
  const [syncEnabled, setSyncEnabled] = useState(true)
  const [isHost, setIsHost] = useState<boolean | null>(null) // null = not determined yet
  const [lastSyncedPosition, setLastSyncedPosition] = useState(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isManualScrollRef = useRef(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const roomCode = params.code as string

  // Auto-scroll chat to bottom when new messages arrive
  // Use a ref to track if user has scrolled up in chat
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(true)
  
  useEffect(() => {
    // Only auto-scroll chat container, NOT the main page
    if (shouldAutoScrollRef.current && chatContainerRef.current && messagesEndRef.current) {
      // Use scrollTop instead of scrollIntoView to avoid affecting main page scroll
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  // Track if user scrolls up in chat area
  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    shouldAutoScrollRef.current = isAtBottom
  }

  // Bootstrap: load room -> pages -> join participant, then start polling.
  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      if (!roomCode) return
      if (!user) return

      try {
        setIsRoomLoading(true)

        // 1) Resolve room by code (room.id is the real UUID used by chat/participants)
        const roomRes = await fetch(`/api/reading-rooms?code=${roomCode}`)
        const roomJson = await roomRes.json()
        if (!roomRes.ok || !roomJson.success || !roomJson.data?.length) {
          throw new Error(roomJson.error || "Room not found")
        }

        const r: ReadingRoom = roomJson.data[0]
        if (cancelled) return
        setRoom(r)
        const userIsHost = r.hostId === user.id
        console.log("[v0] Room loaded - hostId:", r.hostId, "userId:", user.id, "isHost:", userIsHost)
        setIsHost(userIsHost)
        setSyncEnabled(r.syncEnabled !== false)

        // 2) Fetch chapter pages
        const pagesRes = await fetch(`/api/chapters/${r.chapterId}/pages`)
        const pagesJson = await pagesRes.json()
        if (pagesJson.success) {
          console.log("[v0] Pages loaded:", pagesJson.data.length, "pages")
          setPages(pagesJson.data)
          // Don't reset to 0 if room already has a currentPageIndex from host
          if (r.currentPageIndex && r.currentPageIndex > 0) {
            setCurrentPageIndex(r.currentPageIndex)
          }
        }

        // 3) Join room (upsert)
        await fetch("/api/room-participants", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId: r.id, userId: user.id }),
        })

        // 4) Initial loads
        await Promise.all([loadParticipants(r.id), loadMessages(r.id)])
      } catch (e) {
        console.error("[v0] Room bootstrap failed:", e)
        router.push("/library")
      } finally {
        if (!cancelled) setIsRoomLoading(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [roomCode, user])

  // Poll chat + participants (optimized polling intervals)
  useEffect(() => {
    if (!room?.id || !user) return
    if (isChatPolling) return
    setIsChatPolling(true)

    // Faster chat polling for better responsiveness (500ms)
    const chatInterval = setInterval(() => {
      loadMessages(room.id)
    }, 500)

    // Participants update every 4 seconds
    const participantsInterval = setInterval(() => {
      loadParticipants(room.id)
      // keep last_seen fresh
      fetch("/api/room-participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, userId: user.id }),
      }).catch(() => {})
    }, 4000)

    return () => {
      clearInterval(chatInterval)
      clearInterval(participantsInterval)
      setIsChatPolling(false)
    }
  }, [room?.id, user?.id])

  // Load panel comments when the active page changes
  useEffect(() => {
    if (!room?.id || pages.length === 0) return
    // Only load comments if we have a valid page
    if (currentPageIndex >= 0 && currentPageIndex < pages.length) {
      loadPanelComments(room.id)
    }
  }, [room?.id, currentPageIndex, pages.length])

  const loadMessages = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat-messages?roomId=${roomId}`)
      const result = await response.json()
      if (result.success) {
        setMessages(
          result.data.map((m: any) => ({
            id: m.id,
            userId: m.userId,
            username: m.username || "User",
            message: m.message,
            timestamp: new Date(m.createdAt),
          })),
        )
      }
    } catch (error) {
      console.error("[v0] Failed to load messages:", error)
    }
  }, [])

  const loadParticipants = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`/api/room-participants?roomId=${roomId}`)
      const json = await res.json()
      if (json.success) {
        setParticipants(json.data)
      }
    } catch (error) {
      console.error("[v0] Failed to load participants:", error)
    }
  }, [])

  const loadPanelComments = useCallback(
    async (roomId: string) => {
    if (pages.length === 0) return

    try {
      const response = await fetch(`/api/panel-comments?pageId=${pages[currentPageIndex]?.id}&roomId=${roomId}`)
      const result = await response.json()
      if (result.success) {
        setPanelComments(result.data)
      }
    } catch (error) {
      console.error("[v0] Failed to load panel comments:", error)
    }
    },
    [pages, currentPageIndex],
  )

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !user) return
    if (!room?.id) return

    const messageToSend = messageInput.trim()
    const tempId = `temp-${Date.now()}`
    
    // Optimistic update - add message immediately for instant feedback
    const optimisticMessage: Message = {
      id: tempId,
      userId: user.id,
      username: user.displayName || user.username,
      message: messageToSend,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setMessageInput("")

    try {
      const res = await fetch("/api/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: room.id,
          userId: user.id,
          message: messageToSend,
        }),
      })

      if (!res.ok) {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(m => m.id !== tempId))
        console.error("[v0] Failed to send message:", res.statusText)
        return
      }

      // Refresh messages to get server-assigned IDs and ensure consistency
      loadMessages(room.id)
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== tempId))
      console.error("[v0] Failed to send message:", error)
    }
  }

  const handleAddPanelComment = async () => {
    if (!commentText.trim() || !user || pages.length === 0) return
    if (!room?.id) return

    try {
      const response = await fetch("/api/panel-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({
          chapterPageId: pages[currentPageIndex].id,
          roomId: room.id,
          userId: user.id,
          comment: commentText,
          xPosition: 0,
          yPosition: 0,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setPanelComments([...panelComments, result.data])
        setCommentText("")
        setShowCommentForm(false)
      }
    } catch (error) {
      console.error("[v0] Failed to add comment:", error)
    }
  }

  // Handle contextual comment from VerticalScrollReader
  const handleContextualComment = async (pageId: string, pageIndex: number, xPercent: number, yPercent: number, comment: string) => {
    if (!user || !room?.id) return

    try {
      const response = await fetch("/api/panel-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({
          chapterPageId: pageId,
          roomId: room.id,
          userId: user.id,
          comment: comment,
          xPosition: xPercent,
          yPosition: yPercent,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        // Add username to the comment for display
        const newComment = {
          ...result.data,
          username: user.displayName || user.username
        }
        setPanelComments([...panelComments, newComment])
      }
    } catch (error) {
      console.error("[v0] Failed to add contextual comment:", error)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // Delete room (host only)
  const handleDeleteRoom = async () => {
    if (!room?.id || !user || !isHost) return

    const confirmed = window.confirm(
      "Êtes-vous sûr de vouloir supprimer cette room ? Cette action est irréversible et tous les participants seront déconnectés."
    )
    if (!confirmed) return

    try {
      const res = await fetch(
        `/api/reading-rooms?roomId=${room.id}&hostId=${user.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
          },
        }
      )

      const json = await res.json()
      if (json.success) {
        alert("Room supprimée avec succès")
        router.push("/dashboard")
      } else {
        alert(json.error || "Erreur lors de la suppression de la room")
      }
    } catch (error) {
      console.error("[v0] Failed to delete room:", error)
      alert("Erreur lors de la suppression de la room")
    }
  }

  // Host: Send scroll position to server
  const sendScrollPosition = useCallback(async (scrollY: number, pageIndex: number) => {
    if (isHost !== true || !room?.id || !user) return
    
    try {
      await fetch("/api/reading-rooms", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("amrverse_token")}`,
        },
        body: JSON.stringify({
          roomId: room.id,
          hostId: user.id,
          scrollPosition: scrollY,
          currentPageIndex: pageIndex,
        }),
      })
    } catch (error) {
      console.error("[v0] Failed to sync scroll:", error)
    }
  }, [isHost, room?.id, user])

  // Host: Handle scroll events and broadcast position
  useEffect(() => {
    if (isHost !== true || !syncEnabled) return

    let scrollTimeout: NodeJS.Timeout
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout)
      
      scrollTimeout = setTimeout(() => {
        const scrollY = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollPercent = docHeight > 0 ? (scrollY / docHeight) * 100 : 0
        const estimatedPage = Math.floor((scrollPercent / 100) * pages.length)
        
        sendScrollPosition(scrollY, Math.min(estimatedPage, pages.length - 1))
      }, 100) // Faster debounce for more responsive sync (100ms)
    }

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [isHost, syncEnabled, pages.length, sendScrollPosition])

  // Participant: Poll for host's scroll position and sync
  // IMPORTANT: Only non-hosts should sync to the host's position
  useEffect(() => {
    // Wait until isHost is determined (not null)
    if (isHost === null) {
      console.log("[v0] Waiting for host status to be determined...")
      return
    }
    
    // Skip if user is the host
    if (isHost === true) {
      console.log("[v0] User is host - no sync polling needed")
      return
    }
    
    // Skip if sync is disabled or room not loaded
    if (!syncEnabled || !room?.id) return

    console.log("[v0] Starting sync polling for participant (isHost=false)")
    
    const syncInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/reading-rooms?code=${roomCode}`)
        const json = await res.json()
        if (json.success && json.data?.length > 0) {
          const updatedRoom = json.data[0]
          const hostScrollPosition = updatedRoom.currentScrollPosition || 0
          
          // Only sync if position changed significantly (more than 50px)
          if (Math.abs(hostScrollPosition - lastSyncedPosition) > 50) {
            if (!isManualScrollRef.current) {
              window.scrollTo({
                top: hostScrollPosition,
                behavior: "smooth"
              })
            }
            setLastSyncedPosition(hostScrollPosition)
            if (updatedRoom.currentPageIndex !== undefined) {
              setCurrentPageIndex(updatedRoom.currentPageIndex)
            }
          }
        }
      } catch (error) {
        console.error("[v0] Failed to fetch sync position:", error)
      }
    }, 500) // Poll every 500ms for sync

    return () => clearInterval(syncInterval)
  }, [isHost, syncEnabled, room?.id, roomCode, lastSyncedPosition])

  // Allow participants to temporarily break sync when they scroll manually
  useEffect(() => {
    if (isHost === true || isHost === null) return

    let manualScrollTimeout: NodeJS.Timeout
    const handleManualScroll = () => {
      isManualScrollRef.current = true
      if (manualScrollTimeout) clearTimeout(manualScrollTimeout)
      
      // Re-enable sync after 3 seconds of no manual scrolling
      manualScrollTimeout = setTimeout(() => {
        isManualScrollRef.current = false
      }, 3000)
    }

    window.addEventListener("wheel", handleManualScroll)
    window.addEventListener("touchmove", handleManualScroll)
    
    return () => {
      window.removeEventListener("wheel", handleManualScroll)
      window.removeEventListener("touchmove", handleManualScroll)
      if (manualScrollTimeout) clearTimeout(manualScrollTimeout)
    }
  }, [isHost])

  // Toggle sync mode
  const toggleSyncMode = () => {
    setSyncEnabled(prev => !prev)
  }

  // Webtoon-style reader updates currentPageIndex via IntersectionObserver

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Logo 
            variant="room" 
            onClick={() => router.push("/dashboard")} 
            subtitle={`Code: ${roomCode}`}
          />

          <div className="flex items-center gap-3">
            {/* Sync Status Indicator */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              syncEnabled 
                ? "bg-green-500/10 border-green-500/30 text-green-400" 
                : "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
            }`}>
              {syncEnabled ? (
                <>
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span className="text-xs font-medium hidden sm:inline">
                    {isHost ? "Broadcasting" : "Synced"}
                  </span>
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4" />
                  <span className="text-xs font-medium hidden sm:inline">Sync Off</span>
                </>
              )}
            </div>

            {/* Host Badge */}
            {isHost && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-medium text-amber-400 hidden sm:inline">Host</span>
              </div>
            )}

            {/* Toggle Sync Button */}
            <Button
              onClick={toggleSyncMode}
              size="sm"
              variant="outline"
              className={`gap-2 border-primary/40 text-foreground bg-transparent ${
                syncEnabled ? "hover:bg-red-500/10" : "hover:bg-green-500/10"
              }`}
              title={syncEnabled ? "Disable sync" : "Enable sync"}
            >
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">{syncEnabled ? "Unsync" : "Sync"}</span>
            </Button>

            {/* Participants */}
            <div className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-primary/20 rounded-lg">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">{participants.length}</span>
            </div>

            {/* Comment Mode Toggle */}
            <Button
              onClick={() => setCommentModeEnabled(!commentModeEnabled)}
              size="sm"
              variant="outline"
              className={`gap-2 border-primary/40 text-foreground bg-transparent ${
                commentModeEnabled 
                  ? "bg-fuchsia-500/20 border-fuchsia-500/50 text-fuchsia-300" 
                  : "hover:bg-fuchsia-500/10"
              }`}
              title={commentModeEnabled ? "Désactiver mode commentaire" : "Activer mode commentaire"}
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">{commentModeEnabled ? "Commenter: ON" : "Commenter"}</span>
            </Button>

            {/* Copy Room Code */}
            <Button
              onClick={copyRoomCode}
              size="sm"
              variant="outline"
              className="border-primary/40 hover:bg-primary/10 text-foreground bg-transparent"
              title="Copy room code"
            >
              {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>

            {/* Delete Room (Host only) */}
            {isHost && (
              <Button
                onClick={handleDeleteRoom}
                size="sm"
                variant="outline"
                className="gap-2 border-red-500/40 hover:bg-red-500/20 text-red-400 bg-transparent"
                title="Supprimer la room"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Supprimer</span>
              </Button>
            )}

            {/* Exit */}
            <Button
              onClick={handleLogout}
              size="sm"
              variant="outline"
              className="gap-2 border-primary/40 hover:bg-red-500/10 text-foreground bg-transparent"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Reader Area */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-card/30 border border-primary/20 rounded-lg overflow-hidden p-4">
            {isRoomLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : pages.length > 0 ? (
              <VerticalScrollReader
                pages={pages}
                onActiveIndexChange={(idx) => setCurrentPageIndex(idx)}
                className="pb-24"
                comments={panelComments.map(c => ({
                  ...c,
                  username: participants.find(p => p.userId === c.userId)?.username || "User"
                }))}
                commentMode={commentModeEnabled}
                onAddComment={handleContextualComment}
              />
            ) : (
              <div className="text-center space-y-2 text-foreground/60 py-24">
                <BookOpen className="w-12 h-12 mx-auto opacity-50" />
                <p>No pages loaded</p>
              </div>
            )}
          </div>

          {/* Panel Comments Display */}
          {panelComments.length > 0 && (
            <div className="bg-card/20 border border-primary/20 rounded-lg p-4 space-y-3">
              <p className="text-xs font-medium text-foreground/60 flex items-center gap-2">
                <MessageCircle className="w-3 h-3" />
                Comments on current page
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {panelComments.map((comment) => (
                  <div key={comment.id} className="text-xs bg-card/50 p-3 rounded-lg border border-primary/10">
                    <p className="font-medium text-primary text-xs mb-1">Comment</p>
                    <p className="text-foreground/70">{comment.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Comment Section */}
          {pages.length > 0 && (
            <div className="bg-card/40 border border-primary/20 rounded-lg p-4 space-y-3">
              <button
                onClick={() => setShowCommentForm(!showCommentForm)}
                className="flex items-center gap-2 text-sm font-medium text-primary hover:text-secondary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {showCommentForm ? "Hide" : "Add"} Panel Comment
              </button>

              {showCommentForm && (
                <div className="space-y-2">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Share your thoughts on this panel..."
                    className="w-full px-3 py-2 bg-card/50 border border-primary/20 rounded-lg text-foreground placeholder-foreground/50 focus:border-primary/50 focus:outline-none text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAddPanelComment}
                      disabled={!commentText.trim()}
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-white flex-1"
                    >
                      Post Comment
                    </Button>
                    <Button
                      onClick={() => {
                        setShowCommentForm(false)
                        setCommentText("")
                      }}
                      size="sm"
                      variant="outline"
                      className="border-primary/40 text-foreground bg-transparent"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        <aside className="flex flex-col gap-4">
          {/* Participants */}
          <div className="bg-card/40 border border-primary/20 rounded-lg p-4 backdrop-blur-xl">
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participants ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.length === 0 ? (
                <p className="text-foreground/50 text-sm">Waiting for participants...</p>
              ) : (
                participants.map((p) => (
                  <div key={p.userId} className="flex items-center gap-2 px-3 py-2 bg-card/30 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-foreground">{p.username || "Reader"}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="flex-1 flex flex-col bg-card/40 border border-primary/20 rounded-lg backdrop-blur-xl">
            <div 
              ref={chatContainerRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]"
            >
              {messages.length === 0 ? (
                <p className="text-foreground/50 text-sm text-center mt-8">No messages yet</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-primary">{msg.username}</span>
                      <span className="text-xs text-foreground/50">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80 break-words">{msg.message}</p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="border-t border-primary/20 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Say something..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 px-3 py-2 bg-card/50 border border-primary/20 rounded-lg text-foreground placeholder-foreground/50 focus:border-primary/50 focus:outline-none text-sm"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-foreground/40">Press Enter to send</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
