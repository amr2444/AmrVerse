"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Users, Plus, ArrowRight, Loader2, AlertCircle } from "lucide-react"
import { Logo } from "@/components/logo"
import type { ReadingRoom } from "@/lib/types"

type TabType = "join" | "create"

export default function CreateRoomPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, token } = useAuth()
  
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("join")
  
  // Join room state
  const [joinCode, setJoinCode] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState("")
  
  // Create room state
  const [roomName, setRoomName] = useState("")
  const [maxParticipants, setMaxParticipants] = useState("10")
  const [isCreating, setIsCreating] = useState(false)
  const [createdRoom, setCreatedRoom] = useState<ReadingRoom | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)

  const chapterId = searchParams.get("chapterId")
  const manhwaId = searchParams.get("manhwaId")

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) {
      setJoinError("Veuillez entrer un code de room")
      return
    }

    setIsJoining(true)
    setJoinError("")
    
    try {
      // Check if room exists
      const response = await fetch(`/api/reading-rooms?code=${joinCode.trim().toUpperCase()}`)
      const result = await response.json()
      
      if (result.success && result.data?.length > 0) {
        const room = result.data[0]
        if (room.isActive) {
          router.push(`/reading-room/${room.code}`)
        } else {
          setJoinError("Cette room n'est plus active")
        }
      } else {
        setJoinError("Code de room invalide ou room expirée")
      }
    } catch (error) {
      console.error("[v0] Failed to join room:", error)
      setJoinError("Erreur lors de la connexion à la room")
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!user || !chapterId || !manhwaId) return

    setIsCreating(true)
    try {
      const response = await fetch("/api/reading-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          manhwaId,
          chapterId,
          hostId: user.id,
          roomName: roomName || `${user.displayName || user.username}'s Room`,
          maxParticipants: Number.parseInt(maxParticipants),
        }),
      })

      const result = await response.json()
      if (result.success) {
        setCreatedRoom(result.data)
      }
    } catch (error) {
      console.error("[v0] Failed to create room:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const copyRoomCode = () => {
    if (createdRoom) {
      navigator.clipboard.writeText(createdRoom.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const joinRoom = () => {
    if (createdRoom) {
      router.push(`/reading-room/${createdRoom.code}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-card/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Logo size="lg" className="justify-center mb-4" onClick={() => router.push("/dashboard")} />
          <h1 className="text-3xl font-bold text-foreground">Reading Room</h1>
          <p className="text-foreground/60 mt-2">Lisez ensemble en temps réel avec vos amis</p>
        </div>

        {!createdRoom ? (
          <div className="bg-card/40 border border-primary/20 rounded-xl backdrop-blur-xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-primary/20">
              <button
                onClick={() => setActiveTab("join")}
                className={`flex-1 py-4 px-4 font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === "join"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-foreground/60 hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Users className="w-4 h-4" />
                Rejoindre
              </button>
              <button
                onClick={() => setActiveTab("create")}
                className={`flex-1 py-4 px-4 font-medium transition-all flex items-center justify-center gap-2 ${
                  activeTab === "create"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-foreground/60 hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Plus className="w-4 h-4" />
                Créer
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Join Room Tab */}
              {activeTab === "join" && (
                <>
                  <div className="text-center mb-4">
                    <Users className="w-12 h-12 text-primary/60 mx-auto mb-2" />
                    <p className="text-foreground/70 text-sm">
                      Entrez le code partagé par votre ami pour rejoindre sa room
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="joinCode" className="text-sm font-medium text-foreground/80">
                      Code de la Room
                    </label>
                    <Input
                      id="joinCode"
                      type="text"
                      placeholder="Ex: ABC12345"
                      value={joinCode}
                      onChange={(e) => {
                        setJoinCode(e.target.value.toUpperCase())
                        setJoinError("")
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                      disabled={isJoining}
                      className="bg-card/50 border-primary/20 focus:border-primary/50 text-center text-lg font-mono tracking-widest uppercase"
                      maxLength={10}
                    />
                  </div>

                  {joinError && (
                    <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {joinError}
                    </div>
                  )}

                  <Button
                    onClick={handleJoinRoom}
                    disabled={isJoining || !joinCode.trim()}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold h-12"
                  >
                    {isJoining ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Rejoindre la Room
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Create Room Tab */}
              {activeTab === "create" && (
                <>
                  {!chapterId || !manhwaId ? (
                    <div className="text-center py-8">
                      <Plus className="w-12 h-12 text-primary/40 mx-auto mb-4" />
                      <p className="text-foreground/70 mb-4">
                        Pour créer une room, vous devez d'abord sélectionner un chapitre à lire
                      </p>
                      <Button
                        onClick={() => router.push("/library")}
                        variant="outline"
                        className="border-primary/40 hover:bg-primary/10 text-foreground bg-transparent"
                      >
                        Parcourir la bibliothèque
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <label htmlFor="roomName" className="text-sm font-medium text-foreground/80">
                          Nom de la Room (optionnel)
                        </label>
                        <Input
                          id="roomName"
                          type="text"
                          placeholder="Ex: Soirée lecture entre amis..."
                          value={roomName}
                          onChange={(e) => setRoomName(e.target.value)}
                          disabled={isCreating}
                          className="bg-card/50 border-primary/20 focus:border-primary/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="maxParticipants" className="text-sm font-medium text-foreground/80">
                          Nombre max de participants
                        </label>
                        <select
                          id="maxParticipants"
                          value={maxParticipants}
                          onChange={(e) => setMaxParticipants(e.target.value)}
                          disabled={isCreating}
                          className="w-full px-4 py-2 bg-card/50 border border-primary/20 rounded-lg text-foreground focus:border-primary/50 focus:outline-none"
                        >
                          {[2, 5, 10, 20].map((num) => (
                            <option key={num} value={num}>
                              {num} personnes
                            </option>
                          ))}
                        </select>
                      </div>

                      <Button
                        onClick={handleCreateRoom}
                        disabled={isCreating}
                        className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold h-12"
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Création...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Créer la Room
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-card/40 border border-primary/20 rounded-xl p-8 backdrop-blur-xl space-y-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Room Created!</h2>
              <p className="text-foreground/60">Share the code with your friends to start reading together</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Room Code</label>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2 bg-card/50 border border-primary/20 rounded-lg font-mono text-lg font-bold text-primary">
                  {createdRoom.code}
                </div>
                <Button
                  onClick={copyRoomCode}
                  variant="outline"
                  className="border-primary/40 hover:bg-primary/10 text-foreground bg-transparent"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground/80">Room Details</label>
              <div className="space-y-1 text-sm">
                <p className="text-foreground/70">
                  <span className="font-medium">Name:</span> {createdRoom.roomName}
                </p>
                <p className="text-foreground/70">
                  <span className="font-medium">Max Participants:</span> {createdRoom.maxParticipants}
                </p>
                <p className="text-foreground/70">
                  <span className="font-medium">Expires in:</span> 24 hours
                </p>
              </div>
            </div>

            <Button
              onClick={joinRoom}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-semibold h-10"
            >
              Join Room & Start Reading
            </Button>

            <Button
              onClick={() => router.push("/library")}
              variant="outline"
              className="w-full border-primary/40 hover:bg-primary/10 text-foreground bg-transparent"
            >
              Back to Library
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
