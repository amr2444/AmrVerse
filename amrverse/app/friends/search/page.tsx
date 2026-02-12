"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserPlus, Search, Loader2, Users as UsersIcon } from "lucide-react"
import { Logo } from "@/components/logo"

interface User {
  id: string
  username: string
  displayName?: string
  avatarUrl?: string
}

export default function SearchUsersPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user || !token) {
      router.push("/auth")
      return
    }
  }, [user, token])

  const searchUsers = async () => {
    if (!query.trim()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
      } else {
        console.error("Search failed")
      }
    } catch (err) {
      console.error("Error searching users:", err)
    } finally {
      setLoading(false)
    }
  }

  const addFriend = async (friendId: string) => {
    setAddingId(friendId)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendId })
      })

      if (res.ok) {
        alert("Demande d'ami envoyée avec succès !")
        // Retirer l'utilisateur de la liste
        setUsers(users.filter(u => u.id !== friendId))
      } else {
        const data = await res.json()
        alert(data.error || "Erreur lors de l'envoi de la demande")
      }
    } catch (err) {
      console.error("Error adding friend:", err)
      alert("Une erreur est survenue")
    } finally {
      setAddingId(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchUsers()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-purple-950/10 to-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Logo className="mb-8" onClick={() => router.push("/dashboard")} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Search className="w-8 h-8 text-primary" />
            Rechercher des Amis
          </h1>
          <p className="text-foreground/70">
            Trouvez vos amis et connectez-vous avec la communauté AmrVerse
          </p>
        </div>

        {/* Barre de recherche */}
        <Card className="p-6 mb-6">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom ou @username..."
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={searchUsers} disabled={loading || !query.trim()}>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Rechercher
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Résultats */}
        <div className="space-y-4">
          {users.length === 0 && !loading && query && (
            <Card className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60">Aucun utilisateur trouvé</p>
              <p className="text-sm text-foreground/40 mt-2">
                Essayez une autre recherche
              </p>
            </Card>
          )}

          {users.length === 0 && !loading && !query && (
            <Card className="p-12 text-center">
              <Search className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60">Commencez à rechercher des utilisateurs</p>
              <p className="text-sm text-foreground/40 mt-2">
                Entrez un nom ou un @username dans la barre de recherche
              </p>
            </Card>
          )}

          {users.map((searchUser) => (
            <Card key={searchUser.id} className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {(searchUser.displayName || searchUser.username).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold">{searchUser.displayName || searchUser.username}</p>
                  <p className="text-sm text-foreground/60">@{searchUser.username}</p>
                </div>
              </div>
              <Button 
                onClick={() => addFriend(searchUser.id)}
                disabled={addingId === searchUser.id}
              >
                {addingId === searchUser.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Ajouter
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* Bouton retour */}
        <div className="mt-8 text-center">
          <Button variant="outline" onClick={() => router.push('/friends')}>
            Retour à mes amis
          </Button>
        </div>
      </div>
    </div>
  )
}
