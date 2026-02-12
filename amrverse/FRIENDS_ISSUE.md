# 🐛 Problème: Fonctionnalité "Ajouter Ami" Ne Fonctionne Pas

## 📋 Symptômes

L'utilisateur ne peut pas ajouter d'amis ou la fonctionnalité ne répond pas.

---

## 🔍 Diagnostic

### 1. Vérifier la Table en Base de Données

```sql
-- La table existe-t-elle ?
SELECT * FROM friendships LIMIT 5;

-- Vérifier les contraintes
\d friendships
```

**Résultat attendu:**
```
 Column      | Type      | Constraints
-------------+-----------+-------------
 id          | UUID      | PK
 user_id_1   | UUID      | FK users(id)
 user_id_2   | UUID      | FK users(id)
 status      | VARCHAR   | pending/accepted/blocked
 created_at  | TIMESTAMP |
 updated_at  | TIMESTAMP |
 
UNIQUE(user_id_1, user_id_2)
CHECK (user_id_1 < user_id_2)
```

### 2. Vérifier l'API

**Endpoint:** `POST /api/friends`

**Code actuel:** `app/api/friends/route.ts`

**Logique:**
1. ✅ Récupère userId depuis JWT token
2. ✅ Reçoit friendId dans le body
3. ✅ Empêche de s'ajouter soi-même
4. ✅ Ordonne les IDs (petit en premier)
5. ✅ Insère dans friendships

### 3. Problèmes Possibles

#### ❌ **Problème 1: Pas d'Interface Frontend**

Il n'y a **AUCUNE page** où l'utilisateur peut chercher et ajouter des amis !

**Pages manquantes:**
- `/friends` - Liste des amis
- `/users/search` - Rechercher des utilisateurs
- Bouton "Ajouter ami" sur les profils

#### ❌ **Problème 2: Token JWT**

L'API nécessite un token JWT mais le frontend ne l'envoie peut-être pas.

```typescript
// Vérifier dans le code frontend
const res = await fetch('/api/friends', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`, // ← Token présent ?
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ friendId: 'uuid' })
})
```

#### ❌ **Problème 3: Pas de Composant UI**

Aucun composant pour :
- Afficher la liste des amis
- Rechercher des utilisateurs
- Envoyer une demande d'ami
- Accepter/rejeter les demandes

---

## ✅ Solution: Créer l'Interface Amis

### 1. Page de Recherche d'Utilisateurs

**Créer:** `app/friends/search/page.tsx`

```tsx
"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { UserPlus, Search } from "lucide-react"

export default function SearchUsersPage() {
  const { token } = useAuth()
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const searchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/users/search?q=${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setUsers(data.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const addFriend = async (friendId: string) => {
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
        alert("Demande d'ami envoyée !")
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Rechercher des Amis</h1>
      
      <div className="flex gap-2 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom ou @username..."
          onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
        />
        <Button onClick={searchUsers} disabled={loading}>
          <Search className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-4">
        {users.map((user: any) => (
          <Card key={user.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{user.displayName || user.username}</p>
              <p className="text-sm text-foreground/60">@{user.username}</p>
            </div>
            <Button onClick={() => addFriend(user.id)}>
              <UserPlus className="w-5 h-5 mr-2" />
              Ajouter
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

### 2. Page Liste des Amis

**Créer:** `app/friends/page.tsx`

```tsx
"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserPlus, Check, X } from "lucide-react"

export default function FriendsPage() {
  const { token } = useAuth()
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])

  useEffect(() => {
    loadFriends()
    loadPending()
  }, [])

  const loadFriends = async () => {
    const res = await fetch('/api/friends?status=accepted', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setFriends(data.data || [])
  }

  const loadPending = async () => {
    const res = await fetch('/api/friends?status=pending', {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    setPending(data.data || [])
  }

  const handleFriendRequest = async (friendId: string, action: string) => {
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
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mes Amis</h1>
        <Button onClick={() => window.location.href = '/friends/search'}>
          <UserPlus className="w-5 h-5 mr-2" />
          Ajouter des Amis
        </Button>
      </div>

      <Tabs defaultValue="friends">
        <TabsList>
          <TabsTrigger value="friends">Amis ({friends.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({pending.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          {friends.map((friend: any) => (
            <Card key={friend.id} className="p-4">
              <p className="font-semibold">{friend.displayName}</p>
              <p className="text-sm text-foreground/60">@{friend.username}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pending.map((friend: any) => (
            <Card key={friend.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{friend.displayName}</p>
                <p className="text-sm text-foreground/60">@{friend.username}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleFriendRequest(friend.id, 'accept')}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleFriendRequest(friend.id, 'reject')}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 3. Améliorer l'API Users Search

**Vérifier:** `app/api/users/search/route.ts`

Si le fichier n'existe pas ou ne fonctionne pas bien, le corriger.

---

## 🧪 Comment Tester

### Test 1: Chercher un Utilisateur

```bash
# 1. Créer 2 comptes de test
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@test.com",
    "username": "alice",
    "password": "Password123",
    "displayName": "Alice"
  }'

curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "bob@test.com",
    "username": "bob",
    "password": "Password123",
    "displayName": "Bob"
  }'

# 2. Se connecter en tant qu'Alice
# 3. Aller sur /friends/search
# 4. Chercher "bob"
# 5. Cliquer "Ajouter"
```

### Test 2: Accepter une Demande

```bash
# 1. Se connecter en tant que Bob
# 2. Aller sur /friends
# 3. Onglet "En attente"
# 4. Voir la demande d'Alice
# 5. Cliquer ✓ pour accepter
```

### Test 3: Vérifier en DB

```sql
SELECT 
  u1.username as user1,
  u2.username as user2,
  f.status,
  f.created_at
FROM friendships f
JOIN users u1 ON f.user_id_1 = u1.id
JOIN users u2 ON f.user_id_2 = u2.id;
```

---

## 📝 Résumé

**Problème Principal:** Il n'y a **AUCUNE interface utilisateur** pour ajouter des amis.

**Solutions:**
1. ✅ Créer `/friends/search` pour chercher des utilisateurs
2. ✅ Créer `/friends` pour gérer ses amis
3. ✅ Ajouter boutons dans le dashboard
4. ✅ Tester avec 2 comptes utilisateurs

**L'API fonctionne déjà**, il manque juste le frontend !
