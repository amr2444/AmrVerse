# 🚀 Checklist Déploiement Vercel - AmrVerse

## ✅ Étape 1: Vérifier le Code

- [x] Code poussé sur GitHub
- [x] Build local réussi
- [x] Pas d'erreurs TypeScript
- [x] Dépendances installées (jsonwebtoken, socket.io, @types/pg)

---

## 📊 Étape 2: Créer la Base de Données

### Option A: Neon (Recommandé - Gratuit)

1. **Aller sur https://neon.tech**
2. **Sign up** avec GitHub
3. **Create a Project**
   - Name: `amrverse-production`
   - Region: Choisir le plus proche
   - PostgreSQL version: 16
4. **Copier la Connection String**
   ```
   postgresql://username:password@ep-xxx.neon.tech/amrverse?sslmode=require
   ```

### Option B: Vercel Postgres

1. **Dashboard Vercel** → **Storage** → **Create Database**
2. Choisir **Postgres**
3. Name: `amrverse`
4. Copier automatiquement les variables d'environnement

### Option C: Supabase (Gratuit)

1. **https://supabase.com** → **New Project**
2. Name: `amrverse`
3. Region: Le plus proche
4. **Settings** → **Database** → **Connection String**
5. Choisir **Direct connection** (pas pooler)

---

## 🔐 Étape 3: Générer les Secrets JWT

### Sur Windows PowerShell:
```powershell
# NEXTAUTH_SECRET (32 bytes)
$bytes = New-Object byte[] 32
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# JWT_REFRESH_SECRET (64 bytes)
$bytes = New-Object byte[] 64
(New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Sur Linux/Mac:
```bash
openssl rand -base64 32  # NEXTAUTH_SECRET
openssl rand -base64 64  # JWT_REFRESH_SECRET
```

---

## ⚙️ Étape 4: Variables d'Environnement Vercel

### Aller sur Vercel Dashboard

1. **Votre projet AmrVerse** → **Settings** → **Environment Variables**

### Ajouter ces variables (pour Production, Preview, Development):

| Name | Value | Example |
|------|-------|---------|
| `DATABASE_URL` | Connection string de Neon/Vercel/Supabase | `postgresql://user:pass@host/db` |
| `NEXTAUTH_SECRET` | Secret généré (32 bytes) | `abc123...` |
| `NEXTAUTH_URL` | URL de production Vercel | `https://amrverse.vercel.app` |
| `JWT_REFRESH_SECRET` | Secret généré (64 bytes) | `xyz789...` |

### Variables Optionnelles:

| Name | Value | Notes |
|------|-------|-------|
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob | Pour uploads d'images |
| `RESEND_API_KEY` | Token Resend | Pour emails (à ajouter plus tard) |

---

## 🗄️ Étape 5: Exécuter les Migrations SQL

### Se Connecter à la Base de Données

#### Méthode 1: Interface Web (Plus Simple)

**Neon:**
- Dashboard Neon → **SQL Editor**

**Supabase:**
- Dashboard Supabase → **SQL Editor**

**Vercel Postgres:**
- Dashboard Vercel → **Storage** → Votre DB → **Query**

**Copier-coller dans l'ordre:**

1. `scripts/01-create-schema.sql`
2. `scripts/09-creator-requests.sql`

#### Méthode 2: psql (Ligne de commande)

```powershell
# Windows (remplacer par votre connection string)
$env:PGPASSWORD = "votre_password"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://user@host/db?sslmode=require" -f scripts/01-create-schema.sql
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" "postgresql://user@host/db?sslmode=require" -f scripts/09-creator-requests.sql
```

### Vérifier que les Tables sont Créées

```sql
-- Exécuter dans SQL Editor
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

**Résultat attendu (12 tables):**
- chapter_pages
- chapters
- chat_messages
- creator_requests ✨
- friendships
- manhwas
- panel_comments
- reading_progress
- reading_rooms
- room_participants
- user_favorites
- users

---

## 🚀 Étape 6: Déployer sur Vercel

### Option A: Via Dashboard Vercel (Recommandé)

1. **Aller sur https://vercel.com**
2. **Add New** → **Project**
3. **Import Git Repository**
   - Sélectionner votre repo `AmrVerse`
4. **Configure Project**
   - Framework Preset: **Next.js**
   - Root Directory: `.` (ou `amrverse` si structure imbriquée)
   - Build Command: `npm run build` ou `pnpm run build`
   - Output Directory: `.next`
5. **Environment Variables** → Skip (déjà ajoutées)
6. **Deploy** 🚀

### Option B: Via CLI Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod

# Suivre les prompts
```

---

## ✅ Étape 7: Vérifications Post-Déploiement

### 1. Build Réussi ✅
```
✓ Compiled successfully
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

### 2. Tester l'Application

**Page d'accueil:**
```
https://votre-app.vercel.app
```

**Créer un compte:**
```
https://votre-app.vercel.app/auth
```

**Test de connexion DB:**
```sql
-- Dans SQL Editor
SELECT COUNT(*) FROM users;
```

### 3. Vérifier les Variables d'Environnement

Dans les logs Vercel, NE DEVRAIT PAS voir:
- ❌ "DATABASE_URL not set"
- ❌ "NEXTAUTH_SECRET not set"

---

## 🐛 Dépannage

### Erreur: "DATABASE_URL not set"

**Solution:**
1. Vercel Dashboard → Settings → Environment Variables
2. Vérifier que `DATABASE_URL` est présente pour **Production**
3. Redéployer: Deployments → ... → Redeploy

### Erreur: "Failed to connect to database"

**Causes possibles:**
1. Connection string incorrecte
2. Pare-feu bloquant (Neon/Supabase autorise tout par défaut)
3. `?sslmode=require` manquant pour Neon

**Solution:**
```
postgresql://user:pass@host/db?sslmode=require
```

### Erreur: Build échoue

**Vérifier:**
1. `npm run build` fonctionne en local
2. Toutes les dépendances dans `package.json`
3. Pas d'erreurs TypeScript

### Erreur: "Cannot find module 'socket.io'"

**Solution:**
Socket.IO serveur ne fonctionne pas sur Vercel (serverless).
Pour l'instant, les Reading Rooms ne fonctionneront pas en production.

**Alternatives:**
1. Migrer vers Pusher (SaaS)
2. Utiliser un serveur VPS séparé pour Socket.IO
3. Désactiver temporairement les Reading Rooms

---

## 🎯 Checklist Finale

Avant de marquer comme "Déployé":

- [ ] Base de données créée et accessible
- [ ] Tables migrées (12 tables présentes)
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Secrets JWT générés et ajoutés
- [ ] Build Vercel réussi ✅
- [ ] Application accessible via URL Vercel
- [ ] Authentification fonctionne (signup/login)
- [ ] Peut créer un compte et se connecter
- [ ] Dashboard accessible après login

---

## 📝 Informations à Noter

**URL Production:**
```
https://____________.vercel.app
```

**Base de Données:**
- Provider: Neon / Vercel / Supabase
- Connection String: (garder en sécurité)

**Premier Utilisateur Admin:**
```sql
-- À exécuter après déploiement
UPDATE users 
SET is_creator = true, is_admin = true 
WHERE email = 'votre@email.com';
```

---

## 🔜 Après le Déploiement

### 1. Se Promouvoir Admin
```sql
UPDATE users SET is_creator = true WHERE email = 'votre@email.com';
```

### 2. Tester le Système Créateur
- Demande via `/become-creator`
- Approuver dans `/admin/creator-requests`

### 3. Configurer les Emails (Optionnel)
```bash
npm install resend
```
Ajouter `RESEND_API_KEY` dans Vercel

### 4. Domaine Personnalisé (Optionnel)
Vercel → Settings → Domains → Add Domain

---

## ⚠️ Limitations Vercel (Gratuit)

- ✅ Build time: Illimité
- ✅ Bandwidth: 100 GB/mois
- ✅ Deployments: Illimités
- ⚠️ Serverless Functions: 10s timeout
- ⚠️ WebSockets: Non supportés (Socket.IO)

**Pour Socket.IO:** Nécessite un serveur séparé (Railway, Render, etc.)

---

**Prêt à déployer ? Suivez les étapes dans l'ordre ! 🚀**
