# Déploiement production — Vercel + Supabase

Guide pour déployer CFM ASBL en **production durable** avec :

- **Vercel** — hébergement Next.js 15 + domaine `cfmasbl.com`
- **Supabase** — PostgreSQL (données) + Storage (uploads admin)
- Remplacement complet de la démo Netlify

---

## Architecture

```
cfmasbl.com (DNS)
    → Vercel (Next.js)
        → Supabase PostgreSQL (DATABASE_URL pooler)
        → Supabase Storage bucket « media-uploads »
```

Les assets statiques versionnés (`public/media/hero`, SVG axes…) restent dans Git.  
Les **uploads admin** vont dans Supabase Storage (URLs `https://*.supabase.co/storage/...`).

---

## Prérequis

- Compte [Vercel](https://vercel.com)
- Compte [Supabase](https://supabase.com)
- Domaine `cfmasbl.com` (~12 USD/an — Cloudflare Registrar recommandé)
- Dépôt GitHub `dav24300/CFM`

---

## Étape 1 — Supabase

### 1.1 Créer le projet

1. [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Région : **West EU (Paris)** ou la plus proche disponible
3. Noter le mot de passe base de données

### 1.2 PostgreSQL

Dans **Project Settings → Database** :

- Copier **Connection string** → mode **Transaction** (pooler, port **6543**)
- Format : `postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`

Variables :

```env
DATABASE_URL=<connection string pooler>
CFM_PG_NORMALIZED=true
```

Bootstrap (une fois, depuis votre machine) :

```bash
DATABASE_URL="..." npm run bootstrap:pg
```

### 1.3 Storage

1. **Storage → New bucket** : `media-uploads`
2. **Public bucket** : activé (lecture publique des médias du site)
3. Policies : uploads via **service role** uniquement (l’API admin utilise `SUPABASE_SERVICE_ROLE_KEY`)

Optionnel :

```env
SUPABASE_STORAGE_BUCKET=media-uploads
```

### 1.4 Clés API

**Project Settings → API** :

| Variable | Valeur |
|----------|--------|
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` secret (**jamais** côté client) |

---

## Étape 2 — Vercel

### 2.1 Importer le projet

1. [vercel.com/new](https://vercel.com/new) → Import `dav24300/CFM`
2. Framework : **Next.js** (auto)
3. Build : `npm run build` (défaut — **pas** `build:netlify`)

### 2.2 Variables d'environnement

Dans **Settings → Environment Variables** (Production) :

| Variable | Obligatoire |
|----------|-------------|
| `DATABASE_URL` | Oui — pooler Supabase |
| `SUPABASE_URL` | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Oui |
| `SESSION_SECRET` | Oui — 64+ chars aléatoires |
| `ADMIN_PASSWORD` | Oui |
| `DATA_ENCRYPTION_KEY` | Oui — 32+ chars |
| `NEXT_PUBLIC_SITE_URL` | Oui — `https://cfmasbl.com` |
| `CFM_PG_NORMALIZED` | `true` |
| `CFM_IMAGE_COMPRESS` | `true` |
| `CFM_MEDIA_CACHE_TTL` | `300` |
| `UPSTASH_REDIS_REST_URL` | Recommandé (rate limit) |
| `UPSTASH_REDIS_REST_TOKEN` | Recommandé |
| `MOBILE_MONEY_MODE` | `demo` puis `production` |
| `PAYDUNYA_*` | Quand compte marchand actif |
| `SMTP_*` | Brevo pour emails transactionnels |

**Ne pas définir** : `CFM_SERVERLESS`, `NETLIFY`

Générer secrets :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node scripts/generate-vapid.mjs
```

### 2.3 Domaine custom

**Settings → Domains** :

- `cfmasbl.com`
- `www.cfmasbl.com` → redirect vers apex

Si DNS chez Cloudflare :

| Type | Nom | Valeur |
|------|-----|--------|
| CNAME | `www` | `cname.vercel-dns.com` |
| A | `@` | selon instructions Vercel |

### 2.4 Deploy

```bash
git push origin master
```

Ou : `npx vercel --prod`

---

## Étape 3 — Validation

```bash
curl https://cfmasbl.com/api/health
# → { "status": "ok", "checks": { "database": "ok" } }

SMOKE_BASE_URL=https://cfmasbl.com npm run smoke
```

### Uploads admin

1. Connexion `/admin/dashboard`
2. **Médias & design → Defaults** → upload photo fondateur
3. Pas de bandeau « Mode démo »
4. Vérifier `/a-propos` — image mise à jour
5. DevTools → Network : `POST /api/admin/media` → 200 + URL Supabase

Checklist complète : [`docs/vps-media-deploy-checklist.md`](vps-media-deploy-checklist.md) (mêmes tests fonctionnels).

---

## Étape 4 — Couper Netlify

1. Vérifier production Vercel stable 24–48 h
2. [app.netlify.com](https://app.netlify.com) → site `cfmasbl-demo` → désactiver ou supprimer
3. Mettre à jour tous les liens vers `https://cfmasbl.com`

---

## Étape 5 — Paiements & emails

| Service | Configuration |
|---------|---------------|
| **PayDunya** | Webhook `https://cfmasbl.com/api/donations/webhook` |
| **Brevo SMTP** | `SMTP_HOST=smtp-relay.brevo.com`, `CFM_REQUIRE_SMTP=true` |
| **Upstash** | Rate limit distribué sur Vercel serverless |

---

## Sauvegardes

| Quoi | Comment |
|------|---------|
| PostgreSQL | Backups automatiques Supabase (plan Pro) ou `npm run backup:db` |
| Storage | Export périodique bucket depuis dashboard Supabase |
| Secrets | Copie chiffrée de `.env` hors Vercel |

---

## Budget annuel estimé

| Poste | Coût |
|-------|------|
| Domaine `cfmasbl.com` | ~12 USD/an |
| Vercel Hobby (ASBL) | 0 USD* |
| Supabase Free | 0 USD (démarrage) |
| Supabase Pro (si croissance) | ~25 USD/mois |
| Brevo + Upstash free tiers | 0 USD |
| **Total démarrage** | **~12 USD/an** |

\* Vérifier éligibilité ; sinon Vercel Pro ~20 USD/mois.

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Bandeau « upload désactivé » | Vérifier `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` sur Vercel |
| `Bucket not found` | Créer bucket public `media-uploads` |
| `database: degraded` | Vérifier `DATABASE_URL` pooler (port 6543) |
| Images Supabase non affichées | `remotePatterns` dans [`next.config.ts`](../next.config.ts) |
| Build timeout upload | `maxDuration: 120` sur route media ([`vercel.json`](../vercel.json)) |

---

## Dev local avec Supabase

Ajoutez dans `.env.local` :

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://...pooler...
```

Les uploads locaux iront dans Supabase Storage (comme en production Vercel).

---

*CFM ASBL — Production Vercel + Supabase — juillet 2026*
