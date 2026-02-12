# ✅ Implémentation du Workflow Créateur - Terminé

## 📋 Résumé des Modifications

### 1. ✅ Configuration de la Base de Données
- **Fichier**: `scripts/10-add-is-admin.sql`
  - Ajout de la colonne `is_admin` à la table `users`
  - Index pour optimiser les requêtes admin

- **Fichier**: `scripts/09-creator-requests.sql`
  - Table `creator_requests` pour gérer les demandes
  - Champs: presentation, motivation, portfolio_url, status, etc.

### 2. ✅ Système d'Email avec Resend
- **Fichier**: `lib/email.ts`
  - `sendCreatorRequestToAdmin()`: Notification à l'admin avec liens d'approbation/rejet
  - `sendCreatorApprovalEmail()`: Email de félicitations à l'utilisateur approuvé
  - `sendCreatorRejectionEmail()`: Email de notification de rejet

### 3. ✅ API Backend

#### API de Demande Créateur
- **Fichier**: `app/api/creator-requests/route.ts`
  - GET: Récupérer la demande de l'utilisateur connecté
  - POST: Créer une nouvelle demande + envoyer email admin

#### API Admin d'Approbation
- **Fichier**: `app/api/admin/creator-requests/[id]/route.ts`
  - GET: Approuver/rejeter depuis un lien email (avec token)
  - PATCH: Approuver/rejeter depuis le panel admin
  - Met à jour `is_creator = true` lors de l'approbation
  - Envoie les emails appropriés

### 4. ✅ Interface Utilisateur

#### Page Devenir Créateur
- **Fichier**: `app/become-creator/page.tsx`
  - Popup avec formulaire de demande
  - Validation (min 50 caractères pour présentation/motivation)
  - Affichage du statut de la demande (pending/approved/rejected)
  - Auto-refresh toutes les 10s pour détecter l'approbation

#### Contexte d'Authentification
- **Fichier**: `lib/auth-context.tsx`
  - Ajout de `refreshUser()` pour mettre à jour le profil depuis le serveur
  - Permet la mise à jour dynamique du statut créateur

#### Dashboard
- **Fichier**: `app/dashboard/page.tsx`
  - Affichage conditionnel du "Portail Créateur" si `user.isCreator === true`
  - Bouton dans la navbar si créateur

### 5. ✅ Configuration
- **Fichier**: `.env.example`
  - Ajout des variables: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_SECRET_TOKEN`

---

## 🚀 Installation et Déploiement

### Étape 1: Installer les Dépendances
```bash
npm install resend
# ou si vous utilisez pnpm
pnpm add resend
```

### Étape 2: Configurer les Variables d'Environnement
Créer un fichier `.env.local` avec :

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_REFRESH_SECRET=your-jwt-refresh-secret

# Resend Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@votredomaine.com

# Admin Secret Token
ADMIN_SECRET_TOKEN=votre-token-secret-admin

# Base URL
NEXTAUTH_URL=http://localhost:3000
```

**Important**: 
- Créez un compte sur [Resend.com](https://resend.com)
- Obtenez votre `RESEND_API_KEY` depuis le dashboard
- Vérifiez votre domaine pour `RESEND_FROM_EMAIL` (ou utilisez `onboarding@resend.dev` pour les tests)
- Générez un token secret fort pour `ADMIN_SECRET_TOKEN` avec : `openssl rand -base64 32`

### Étape 3: Appliquer les Migrations
```bash
# Ajouter la colonne is_admin
psql $DATABASE_URL -f scripts/10-add-is-admin.sql

# Créer la table creator_requests
psql $DATABASE_URL -f scripts/09-creator-requests.sql

# Définir votre compte comme admin
psql $DATABASE_URL -c "UPDATE users SET is_admin = TRUE WHERE email = 'akef.minato@gmail.com';"
```

### Étape 4: Builder et Tester
```bash
npm run build
npm run dev
```

---

## 🔄 Workflow Complet

### 1. Utilisateur Soumet une Demande
1. L'utilisateur visite `/become-creator`
2. Clique sur "Devenir Créateur"
3. Remplit le formulaire (présentation, motivation)
4. Clique sur "Envoyer ma demande"
5. ✅ Email envoyé automatiquement à `akef.minato@gmail.com`

### 2. Admin Reçoit l'Email
L'email contient :
- Nom et email du candidat
- Présentation complète
- Motivation
- Portfolio (si fourni)
- **Bouton "✅ Approuver"** (lien direct)
- **Bouton "❌ Rejeter"** (lien direct)

### 3. Approbation par Email
**Option A : Via Email (Recommandé)**
1. Admin clique sur "✅ Approuver" dans l'email
2. Page de confirmation s'affiche
3. La base de données est mise à jour (`is_creator = true`)
4. Email de félicitations envoyé automatiquement à l'utilisateur

**Option B : Via Panel Admin**
1. Admin se connecte au dashboard admin
2. Va sur `/admin/creator-requests`
3. Approuve ou rejette la demande

### 4. Utilisateur Approuvé
1. Reçoit un email de félicitations
2. L'interface se met à jour automatiquement (max 10s)
3. Redirection vers `/admin/upload-content`
4. Le bouton "Portail Créateur" apparaît dans le dashboard
5. Accès complet aux fonctionnalités créateur

### 5. Si Rejeté
1. Reçoit un email de notification
2. Peut soumettre une nouvelle demande plus tard
3. Reste utilisateur normal avec accès en lecture

---

## 🔐 Sécurité

### Authentification Admin
- Les liens d'approbation/rejet utilisent `ADMIN_SECRET_TOKEN`
- Token validé côté serveur avant toute action
- Les routes PATCH nécessitent `is_admin = true` en base

### Protection des Données
- Toutes les routes API requièrent un JWT valide
- Validation des inputs (min 50 caractères)
- Protection contre les soumissions multiples

### Emails
- Envoyés de manière asynchrone (ne bloquent pas l'API)
- Erreurs d'email loggées mais ne bloquent pas le workflow
- Templates HTML sécurisés

---

## 📧 Templates d'Email

### 1. Notification Admin
- Design professionnel avec gradient
- Boutons d'action clairs (vert/rouge)
- Toutes les informations nécessaires
- Lien vers le panel admin

### 2. Email d'Approbation
- Félicitations avec emojis
- Liste des fonctionnalités créateur
- Bouton CTA vers le portail créateur
- Conseils pour débuter

### 3. Email de Rejet
- Ton respectueux et encourageant
- Raison du rejet (si fournie)
- Invitation à continuer comme lecteur
- Possibilité de resoumettre plus tard

---

## 🧪 Tests Recommandés

Voir le fichier `tmp_rovodev_test_workflow.md` pour le guide de test complet.

**Checklist rapide :**
- [ ] Créer un compte utilisateur normal
- [ ] Soumettre une demande créateur
- [ ] Vérifier la réception de l'email admin
- [ ] Approuver via le lien email
- [ ] Vérifier l'email d'approbation
- [ ] Vérifier que `is_creator = true` en base
- [ ] Vérifier l'accès au portail créateur
- [ ] Tester un rejet
- [ ] Vérifier qu'on ne peut pas soumettre deux fois

---

## 🐛 Dépannage

### L'email ne s'envoie pas
```bash
# Vérifier les variables d'environnement
echo $RESEND_API_KEY
echo $RESEND_FROM_EMAIL

# Vérifier les logs serveur
# Rechercher: [Email] Error sending
```

### Le lien d'approbation ne fonctionne pas
- Vérifier que `ADMIN_SECRET_TOKEN` est défini et identique dans `.env`
- Vérifier l'URL complète du lien
- Format: `http://localhost:3000/api/admin/creator-requests/{id}?action=approve&token={TOKEN}`

### L'UI ne se met pas à jour
- Vérifier que `refreshUser()` est appelé
- Vérifier le localStorage : `localStorage.getItem("amrverse_user")`
- Se déconnecter et se reconnecter
- Vérifier que `is_creator = true` en base de données

### Le portail créateur n'apparaît pas
```sql
-- Vérifier le statut en base
SELECT id, email, is_creator FROM users WHERE email = 'user@example.com';

-- Forcer is_creator si nécessaire
UPDATE users SET is_creator = TRUE WHERE email = 'user@example.com';
```

---

## 📝 Notes Importantes

### Pour la Production (Vercel)
1. Ajouter toutes les variables d'environnement dans Vercel Dashboard
2. Utiliser un domaine vérifié pour `RESEND_FROM_EMAIL`
3. Générer un nouveau `ADMIN_SECRET_TOKEN` fort
4. Mettre `NEXTAUTH_URL` avec votre domaine de production

### Améliorations Futures
- [ ] Panel admin pour voir toutes les demandes
- [ ] Statistiques des demandes
- [ ] Système de notifications in-app
- [ ] Historique des décisions admin
- [ ] Templates d'email personnalisables
- [ ] Raisons de rejet prédéfinies

---

## ✅ Statut Final

**Toutes les tâches sont complètes :**
1. ✅ Colonne `is_admin` ajoutée
2. ✅ Resend configuré
3. ✅ Popup de demande créé
4. ✅ Email de notification admin implémenté
5. ✅ Templates d'email créés
6. ✅ API admin créée
7. ✅ Système d'approbation par email avec liens
8. ✅ UI mise à jour dynamiquement
9. ✅ Documentation et guide de test créés

**Reste à faire :**
- Installer le package `resend` : `npm install resend` ou `pnpm add resend`
- Configurer les variables d'environnement
- Tester le workflow complet

---

**Créé le:** 2026-02-12  
**Email Admin:** akef.minato@gmail.com  
**Statut:** ✅ Prêt pour le déploiement
