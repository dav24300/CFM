# Variables Vercel — production (cfm-asbl)

Ajoutez dans **Vercel → cfm-asbl → Settings → Environment Variables → Production** :

| Variable | Exemple / note |
|----------|----------------|
| `DATABASE_URL` | Pooler Supabase port **6543** (mode Transaction) |
| `SUPABASE_URL` | `https://mzzgzcksavtuegamyudg.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard Supabase → Settings → API |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ADMIN_PASSWORD` | Mot de passe fort admin |
| `DATA_ENCRYPTION_KEY` | 32+ caractères aléatoires |
| `NEXT_PUBLIC_SITE_URL` | URL Vercel prod (voir ci-dessous) |
| `CFM_PG_NORMALIZED` | `true` |
| `CFM_IMAGE_COMPRESS` | `true` |
| `CFM_MEDIA_CACHE_TTL` | `300` |
| `MOBILE_MONEY_MODE` | `demo` |
| `NEXT_PUBLIC_MOBILE_MONEY_MODE` | `demo` |
| `SUPABASE_STORAGE_BUCKET` | `media-uploads` |

**Ne pas définir** : `CFM_SERVERLESS`, `NETLIFY`

Après ajout des variables → **Deployments → Redeploy**.

## Supabase (une fois)

1. Bucket public `media-uploads`
2. `DATABASE_URL="..." npm run bootstrap:pg`

## URL production

Projet : `moembodavid125-7235s-projects/cfm-asbl`  
URL stable après deploy réussi : `https://cfm-asbl.vercel.app` (ou alias affiché dans Vercel Domains)
