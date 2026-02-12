# 🎨 Système de Demande Créateur - AmrVerse

## 📋 Vue d'Ensemble

Système complet pour gérer les demandes de statut créateur avec workflow d'approbation administrateur.

---

## 🔄 Workflow Complet

```
1. Utilisateur clique "Devenir Créateur" (page d'accueil)
   ↓
2. Redirigé vers /become-creator (ou /auth si non connecté)
   ↓
3. Remplit le formulaire de candidature
   ↓
4. Demande soumise → Status: PENDING
   ↓
5. Message "Veuillez attendre votre réponse"
   ↓
6. Admin examine la demande dans /admin/creator-requests
   ↓
7. Admin APPROUVE ou REJETTE
   ↓
8. Email envoyé à l'utilisateur (TODO: implémenter)
   ↓
9. Si APPROUVÉ: is_creator = true → Accès portail créateur
```

---

## 📁 Fichiers Créés

### Base de Données
- **`scripts/09-creator-requests.sql`** - Table creator_requests

### API Routes
- **`app/api/creator-requests/route.ts`** - GET/POST pour utilisateurs
- **`app/api/admin/creator-requests/route.ts`** - GET pour admin (toutes demandes)
- **`app/api/admin/creator-requests/[id]/route.ts`** - PATCH pour approuver/rejeter

### Pages
- **`app/become-creator/page.tsx`** - Formulaire de candidature
- **`app/admin/creator-requests/page.tsx`** - Dashboard admin

### Modifications
- **`app/page.tsx`** - Bouton "Devenir Créateur" → `/become-creator`

---

## 🗄️ Structure de la Table

```sql
CREATE TABLE creator_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  presentation TEXT NOT NULL,        -- Min 50 chars
  motivation TEXT NOT NULL,          -- Min 50 chars
  portfolio_url VARCHAR(500),        -- Optionnel
  status VARCHAR(50) DEFAULT 'pending', -- pending/approved/rejected
  admin_notes TEXT,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints

### Pour Utilisateurs

#### `GET /api/creator-requests`
Récupérer SA propre demande (authentifié)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "pending|approved|rejected",
    "createdAt": "2024-01-01",
    ...
  }
}
```

#### `POST /api/creator-requests`
Soumettre une nouvelle demande

**Body:**
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "presentation": "Je suis un artiste...", // Min 50 chars
  "motivation": "Je veux créer...",         // Min 50 chars
  "portfolioUrl": "https://..."            // Optionnel
}
```

**Validations:**
- ✅ Authentifié
- ✅ Présentation ≥ 50 caractères
- ✅ Motivation ≥ 50 caractères
- ✅ Pas de demande en cours
- ✅ Pas déjà créateur

---

### Pour Admins

#### `GET /api/admin/creator-requests?status=pending`
Liste toutes les demandes par statut

**Query Params:**
- `status`: pending | approved | rejected

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "johndoe",
      "fullName": "John Doe",
      "email": "john@example.com",
      "presentation": "...",
      "motivation": "...",
      "status": "pending",
      ...
    }
  ]
}
```

#### `PATCH /api/admin/creator-requests/:id`
Approuver ou rejeter une demande

**Body:**
```json
{
  "action": "approve" | "reject",
  "adminNotes": "Notes optionnelles"
}
```

**Actions:**
- `approve`: Met `is_creator = true` + envoie email ✅
- `reject`: Met status rejected + envoie email ❌

---

## 👤 Expérience Utilisateur

### 1. Page de Candidature (`/become-creator`)

**Cas 1: Utilisateur non connecté**
→ Redirection vers `/auth`

**Cas 2: Déjà créateur**
→ Redirection vers `/admin/upload-content`

**Cas 3: Demande en attente**
→ Affiche message "Demande en cours de traitement"

**Cas 4: Demande rejetée**
→ Affiche raison du rejet + notes admin

**Cas 5: Aucune demande**
→ Affiche formulaire

### 2. Formulaire

**Champs requis:**
- Nom complet
- Email (pré-rempli)
- Présentation (min 50 chars)
- Motivation (min 50 chars)
- Portfolio URL (optionnel)

**Validation temps réel:**
- Compteur de caractères
- Bouton désactivé si < 50 chars
- Messages d'erreur clairs

### 3. Après Soumission

```
┌─────────────────────────────────┐
│  ✅ Demande envoyée !           │
│                                 │
│  Veuillez attendre votre        │
│  réponse                        │
│                                 │
│  Vous recevrez un email à:      │
│  john@example.com               │
│                                 │
│  Redirection vers dashboard...  │
└─────────────────────────────────┘
```

---

## 👨‍💼 Dashboard Admin

### URL: `/admin/creator-requests`

**Accès:**
- ✅ Utilisateur connecté
- ✅ `is_creator = true` (temporaire)
- 🔜 `is_admin = true` (à implémenter)

### Onglets

**1. En attente** (pending)
- Liste des demandes non traitées
- Formulaire notes admin
- Boutons Approuver / Rejeter

**2. Approuvées** (approved)
- Historique des approuvés
- Affiche reviewer + date

**3. Rejetées** (rejected)
- Historique des rejets
- Affiche raisons

### Carte de Demande

```
┌─────────────────────────────────────────┐
│ John Doe (@johndoe)                     │
│ john@example.com                        │
│ Demandé le 15/01/2024                   │
│                                         │
│ 📝 Présentation:                        │
│ Je suis un artiste passionné...        │
│                                         │
│ 💡 Motivation:                          │
│ Je veux créer des manhwas sur...       │
│                                         │
│ 🔗 Portfolio: [Voir]                    │
│                                         │
│ Notes admin: [________]                 │
│                                         │
│ [✅ Approuver]  [❌ Rejeter]            │
└─────────────────────────────────────────┘
```

---

## 📧 Emails (À Implémenter)

### Email d'Approbation

**Sujet:** Félicitations ! Vous êtes maintenant créateur AmrVerse 🎉

**Contenu:**
```
Bonjour {fullName},

Nous sommes ravis de vous informer que votre demande de statut 
créateur a été approuvée !

Vous pouvez maintenant:
- Publier vos manhwas
- Gérer vos chapitres
- Interagir avec votre communauté

Commencez dès maintenant: https://amrverse.com/admin/upload-content

Bienvenue dans la famille AmrVerse ! 🚀

L'équipe AmrVerse
```

### Email de Rejet

**Sujet:** Mise à jour sur votre demande créateur AmrVerse

**Contenu:**
```
Bonjour {fullName},

Merci pour votre intérêt à devenir créateur sur AmrVerse.

Après examen, nous ne pouvons pas approuver votre demande 
pour le moment.

{adminNotes si présent}

N'hésitez pas à soumettre une nouvelle demande dans le futur.

Cordialement,
L'équipe AmrVerse
```

---

## 🔐 Sécurité

### Vérifications API

✅ **Authentification JWT** sur toutes les routes  
✅ **Une demande par utilisateur** (UNIQUE constraint)  
✅ **Validation longueur** (50 chars minimum)  
✅ **Admin uniquement** pour approval/reject  
✅ **SQL injection protected** (parameterized queries)  

### Permissions

| Route | Accès |
|-------|-------|
| `/become-creator` | Utilisateurs connectés non-créateurs |
| `/api/creator-requests` GET | Utilisateur connecté (sa demande) |
| `/api/creator-requests` POST | Utilisateur connecté |
| `/admin/creator-requests` | Admin (is_creator pour l'instant) |

---

## 🚀 Prochaines Améliorations

### 1. Système d'Email (PRIORITÉ)
```javascript
// Utiliser un service d'email
import { sendEmail } from '@/lib/email'

await sendEmail({
  to: request.email,
  subject: 'Demande approuvée',
  template: 'creator-approved',
  data: { fullName: request.full_name }
})
```

**Services recommandés:**
- Resend (gratuit 3k emails/mois)
- SendGrid (gratuit 100/jour)
- AWS SES (très bon marché)

### 2. Colonne `is_admin` dans Users
```sql
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;

-- Promouvoir votre compte
UPDATE users SET is_admin = true WHERE email = 'votre@email.com';
```

### 3. Notifications In-App
- Badge "1 nouvelle demande" dans le navbar admin
- WebSocket pour notifications temps réel

### 4. Analytics Dashboard
- Nombre de demandes par mois
- Taux d'approbation
- Temps moyen de traitement

### 5. Système de Révision
- Permettre aux rejetés de renvoyer une demande
- Historique des modifications

---

## 🧪 Comment Tester

### Test Utilisateur

1. **Créer un compte**
```
http://localhost:3000/auth
```

2. **Aller sur la page d'accueil**
```
http://localhost:3000
→ Cliquer "Devenir Créateur"
```

3. **Remplir le formulaire**
- Nom: John Doe
- Email: john@test.com
- Présentation: (min 50 chars)
- Motivation: (min 50 chars)
- Portfolio: https://example.com (optionnel)

4. **Vérifier le message de confirmation**

### Test Admin

1. **Promouvoir votre compte en créateur**
```sql
UPDATE users SET is_creator = true WHERE email = 'votre@email.com';
```

2. **Accéder au dashboard admin**
```
http://localhost:3000/admin/creator-requests
```

3. **Approuver une demande**
- Onglet "En attente"
- Ajouter des notes (optionnel)
- Cliquer "Approuver"

4. **Vérifier que l'utilisateur est créateur**
```sql
SELECT email, is_creator FROM users WHERE id = 'user_id';
```

---

## ❓ FAQ

**Q: Pourquoi is_creator au lieu de is_admin pour l'accès admin ?**
R: C'est temporaire. Ajoutez une colonne `is_admin` pour séparer les rôles.

**Q: Les emails sont envoyés ?**
R: Non, c'est marqué TODO. Implémentez avec Resend ou SendGrid.

**Q: Un utilisateur peut soumettre plusieurs demandes ?**
R: Non, la contrainte UNIQUE(user_id) l'empêche.

**Q: Que se passe-t-il si je rejette puis l'utilisateur veut réessayer ?**
R: Il faut implémenter la logique pour permettre une nouvelle soumission après rejet.

---

## 📞 Support

Pour toute question ou bug:
1. Vérifier les logs serveur
2. Vérifier la table `creator_requests` en DB
3. Vérifier que l'utilisateur est bien authentifié

---

**Créé avec ❤️ pour AmrVerse - Par les Créateurs, Pour les Créateurs**
