"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Check, X, Loader2, Users as UsersIcon } from "lucide-react"
import { Logo } from "@/components/logo"

interface Friend {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
  status: string
}

export default function FriendsPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [friends, setFriends] = useState<Friend[]>([])
  const [pending, setPending] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !token) {
      router.push("/auth")
      return
    }

    loadFriends()
    loadPending()
  }, [user, token])

  const loadFriends = async () => {
    try {
      const res = await fetch('/api/friends?status=accepted', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setFriends(data.data || [])
    } catch (err) {
      console.error("Error loading friends:", err)
    }
  }

  const loadPending = async () => {
    try {
      const res = await fetch('/api/friends?status=pending', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPending(data.data || [])
    } catch (err) {
      console.error("Error loading pending:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleFriendRequest = async (friendId: string, action: "accept" | "reject") => {
    try {
      const res = await fetch('/api/friends', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId, action })
      })

      if (res.ok) {
        loadFriends()
        loadPending()
      } else {
        alert("Erreur lors du traitement de la demande")
      }
    } catch (err) {
      console.error("Error handling request:", err)
      alert("Une erreur est survenue")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Logo className="mb-4" onClick={() => router.push("/dashboard")} />
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <UsersIcon className="w-8 h-8 text-primary" />
              Mes Amis
            </h1>
            <p className="text-foreground/70 mt-2">
              Gérez vos amis et vos demandes d'amitié
            </p>
          </div>
          <Button onClick={() => router.push('/friends/search')}>
            <UserPlus className="w-5 h-5 mr-2" />
            Ajouter des Amis
          </Button>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="friends" className="flex items-center gap-2">
              <UsersIcon className="w-4 h-4" />
              Amis ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              En attente ({pending.length})
            </TabsTrigger>
          </TabsList>

          {/* Liste des amis */}
          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <Card className="p-12 text-center">
                <UsersIcon className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                <p className="text-foreground/60 mb-4">Vous n'avez pas encore d'amis</p>
                <Button onClick={() => router.push('/friends/search')}>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Rechercher des Amis
                </Button>
              </Card>
            ) : (
              friends.map((friend) => (
                <Card key={friend.id} className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{friend.displayName || friend.username}</p>
                      <p className="text-sm text-foreground/60">@{friend.username}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => router.push(`/profile/${friend.id}`)}>
                    Voir le profil
                  </Button>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Demandes en attente */}
          <TabsContent value="pending" className="space-y-4">
            {pending.length === 0 ? (
              <Card className="p-12 text-center">
                <UserPlus className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                <p className="text-foreground/60">Aucune demande en attente</p>
              </Card>
            ) : (
              pending.map((friend) => (
                <Card key={friend.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                      {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{friend.displayName || friend.username}</p>
                      <p className="text-sm text-foreground/60">@{friend.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleFriendRequest(friend.id, 'accept')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accepter
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleFriendRequest(friend.id, 'reject')}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Refuser
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
