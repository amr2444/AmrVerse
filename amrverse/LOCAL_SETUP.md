# Local Setup

Le projet peut tourner completement en local, sans Vercel.

## Prerequis

- Node.js 20+
- PostgreSQL local

## 1. Base de donnees

Cree une base locale nommee `amrverse`, puis applique les scripts SQL dans cet ordre:

```sql
\i scripts/01-create-schema.sql
\i scripts/09-creator-requests.sql
\i scripts/10-add-is-admin.sql
```

Si tu veux des donnees de test, tu peux ensuite charger un seed adapte.

## 2. Variables d'environnement

Cree `amrverse/.env.local` a partir de `amrverse/.env.example`.

Valeurs minimales requises:

```env
DATABASE_URL=postgresql://postgres:your-password@localhost:5432/amrverse
NEXTAUTH_SECRET=replace-with-a-random-secret
NEXTAUTH_URL=http://localhost:3000
JWT_REFRESH_SECRET=replace-with-a-second-random-secret
ADMIN_SECRET_TOKEN=replace-with-a-third-random-secret
```

`RESEND_API_KEY` et `BLOB_READ_WRITE_TOKEN` sont optionnels tant que tu ne testes pas ces fonctions.

## 3. Installation

Sous PowerShell Windows, si `npm` est bloque par la policy, utilise `npm.cmd`.

```powershell
cd amrverse
npm.cmd install
```

## 4. Lancement

```powershell
cd amrverse
npm.cmd run dev
```

L'application sera disponible sur `http://localhost:3000`.

## 5. Point important

Si le login ou signup renvoie un `500`, verifie d'abord que la colonne `is_admin` existe bien dans la table `users`.
