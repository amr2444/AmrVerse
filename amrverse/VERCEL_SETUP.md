# 🚀 Configuration Vercel - AmrVerse

## ✅ Build TypeScript Réussi !

Le code compile maintenant sans erreurs. Il ne reste qu'à configurer les variables d'environnement.

---

## 📋 Variables d'Environnement Requises

### 1️⃣ **Database (OBLIGATOIRE)**

```bash
DATABASE_URL=postgresql://username:password@host:5432/amrverse
```

**Options pour la base de données en production :**

#### Option A : Vercel Postgres (Recommandé)
1. Aller sur votre dashboard Vercel
2. Onglet **Storage** → **Create Database** → **Postgres**
3. Copier le `DATABASE_URL` généré automatiquement

#### Option B : Neon (Gratuit, Serverless)
1. Créer un compte sur [neon.tech](https://neon.tech)
2. Créer un projet PostgreSQL
3. Copier la connection string

#### Option C : Supabase (Gratuit)
1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **Database** → **Connection String**
3. Copier la connection string (mode Direct)

#### Option D : Railway (Gratuit)
1. Créer un compte sur [railway.app](https://railway.app)
2. Créer un service PostgreSQL
3. Copier le `DATABASE_URL`

---

### 2️⃣ **Secrets JWT (OBLIGATOIRE)**

```bash
NEXTAUTH_SECRET=<générer-avec-commande-ci-dessous>
NEXTAUTH_URL=https://votre-app.vercel.app
JWT_REFRESH_SECRET=<générer-avec-commande-ci-dessous>
```

**Générer des secrets forts :**

```bash
# Sur Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Sur Linux/Mac
openssl rand -base64 32  # Pour NEXTAUTH_SECRET
openssl rand -base64 64  # Pour JWT_REFRESH_SECRET
```

---

### 3️⃣ **Vercel Blob (OPTIONNEL - pour uploads)**

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx
```

**Comment l'obtenir :**
1. Dashboard Vercel → **Storage** → **Blob**
2. Créer un Blob Store
3. Copier le token généré

---

## 🔧 Configuration sur Vercel

### Méthode 1 : Via Dashboard (Recommandé)

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Sélectionner votre projet AmrVerse
3. **Settings** → **Environment Variables**
4. Ajouter chaque variable :

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | `postgresql://...` | Production, Preview, Development |
| `NEXTAUTH_SECRET` | `<secret généré>` | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://votre-app.vercel.app` | Production uniquement |
| `JWT_REFRESH_SECRET` | `<secret généré>` | Production, Preview, Development |

5. **Save** et **Redeploy** le projet

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add JWT_REFRESH_SECRET production
vercel env add NEXTAUTH_URL production

# Redéployer
vercel --prod
```

---

## 🗄️ Migration de la Base de Données

Une fois la base de données créée sur Vercel/Neon/Supabase, vous devez créer les tables.

### Étape 1 : Récupérer la DATABASE_URL de production

```bash
# Exemple Neon
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/amrverse
```

### Étape 2 : Exécuter les migrations

**Depuis votre machine locale :**

```bash
# Windows PowerShell
$env:DATABASE_URL = "postgresql://user:pass@host/db"
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" $env:DATABASE_URL -f scripts/01-create-schema.sql
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" $env:DATABASE_URL -f scripts/seed-complete.sql
```

**OU via l'interface web :**
- Neon : SQL Editor
- Supabase : SQL Editor
- Vercel Postgres : Query tab

Copier-coller le contenu de `scripts/01-create-schema.sql`

---

## ✅ Checklist de Déploiement

- [ ] Base de données PostgreSQL créée (Vercel/Neon/Supabase)
- [ ] `DATABASE_URL` ajoutée dans Vercel Environment Variables
- [ ] `NEXTAUTH_SECRET` généré et ajouté
- [ ] `JWT_REFRESH_SECRET` généré et ajouté
- [ ] `NEXTAUTH_URL` configuré avec l'URL de production
- [ ] Tables créées via scripts SQL
- [ ] Redéploiement lancé sur Vercel
- [ ] Build réussi ✅
- [ ] Application accessible en ligne 🎉

---

## 🐛 Dépannage

### Build échoue avec "DATABASE_URL not set"
→ Vérifier que les variables sont ajoutées pour **Production, Preview ET Development**

### "Authentication failed" après déploiement
→ Vérifier que `NEXTAUTH_URL` pointe vers l'URL de production Vercel

### Images ne s'uploadent pas
→ Configurer `BLOB_READ_WRITE_TOKEN` ou migrer vers Cloudinary

---

## 📚 Ressources

- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Neon Database](https://neon.tech/docs/introduction)
- [Supabase](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

---

**Une fois configuré, votre application AmrVerse sera déployée et fonctionnelle ! 🚀**
