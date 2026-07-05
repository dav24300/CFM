# Variables Vercel — production (cfm-asbl)

Ajoutez dans **Vercel → cfm-asbl → Settings → Environment Variables → Production** :

| Variable | Exemple / note |
|----------|----------------|
| `DATABASE_URL` | Pooler Supabase port **6543** (mode Transaction) |
| `SUPABASE_URL` | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase → Settings → API |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PASSWORD` | Mot de passe fort admin |
| `DATA_ENCRYPTION_KEY` | 32+ caractères aléatoires |
| `NEXT_PUBLIC_SITE_URL` | `https://cfm-asbl.vercel.app` |
| `CFM_PG_NORMALIZED` | `true` |
| `CFM_IMAGE_COMPRESS` | `true` |
| `CFM_MEDIA_CACHE_TTL` | `300` |
| `CFM_CONTENT_CACHE_TTL` | `300` |
| `SUPABASE_STORAGE_BUCKET` | `media-uploads` |

## P1 — Services production (plan dette)

| Variable | Usage |
|----------|--------|
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Emails transactionnels (Brevo/Resend) |
| `CFM_REQUIRE_SMTP` | `true` en prod — refuse les emails silencieux en log |
| `MOBILE_MONEY_MODE` | `production` pour PayDunya réel |
| `NEXT_PUBLIC_MOBILE_MONEY_MODE` | `production` |
| `PAYDUNYA_MASTER_KEY`, `PAYDUNYA_PRIVATE_KEY`, `PAYDUNYA_TOKEN` | Mobile Money |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limit distribué (`/api/health` → redis ok) |

## P8 — Live temps réel (Pusher)

| Variable | Usage |
|----------|--------|
| `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` | Serveur |
| `NEXT_PUBLIC_PUSHER_KEY`, `NEXT_PUBLIC_PUSHER_CLUSTER` | Client chat live |

Sans Pusher : le chat repasse en polling 3 s (fallback).

**Ne pas définir** : `CFM_SERVERLESS`, `NETLIFY`

Après ajout des variables → **Deployments → Redeploy**.

## Supabase (une fois)

1. Bucket public `media-uploads`
2. `DATABASE_URL="..." npm run bootstrap:pg`
3. Backups : Dashboard Supabase → Database → Backups (ou `npm run backup:db`)

## URL production

Projet : `moembodavid125-7235s-projects/cfm-asbl`  
URL stable : `https://cfm-asbl.vercel.app`
