# Architecture Production — CFM ASBL

> **Version** : 1.0 · juillet 2026  
> **Périmètre** : infrastructure scalable pour une startup ASBL en forte croissance (V1 → V3)  
> **Stack** : Next.js 15 · PostgreSQL · Redis · Cloudflare CDN

---

## 1. Principes directeurs

| Principe | Application CFM |
|----------|-------------------|
| **Monolithe modulaire d'abord** | Un déploiement Next.js avec couches Clean Architecture ; extraction microservices uniquement si un domaine devient un goulot isolé (live, paiements). |
| **PostgreSQL source de vérité** | Toutes les écritures convergent vers PG normalisé ; JSON blob `app_state` en fallback de migration. |
| **État en lecture optimisé** | Cache process → Next.js Data Cache → CDN edge pour contenu public. |
| **Fail-fast en production** | Secrets obligatoires, chiffrement AES des données sensibles, rate limit distribué. |
| **API minces, logique dans les services** | Routes = validation Zod + orchestration ; use-cases testables unitairement. |

---

## 2. Architecture système

### 2.1 Vue globale (production cible)

```
                         ┌─────────────────────────────────────┐
                         │         Cloudflare CDN / WAF        │
                         │  TLS · cache statique · DDoS shield │
                         └──────────────────┬──────────────────┘
                                            │ HTTPS
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
              ▼                             ▼                             ▼
     ┌────────────────┐           ┌────────────────┐           ┌────────────────┐
     │  Next.js #1    │           │  Next.js #2    │           │  Next.js #N    │
     │  (standalone)  │           │  (standalone)  │           │  (standalone)  │
     │  App Router    │           │  App Router    │           │  App Router    │
     │  RSC + API     │           │  RSC + API     │           │  RSC + API     │
     └───────┬────────┘           └───────┬────────┘           └───────┬────────┘
             │                            │                            │
             └────────────────────────────┼────────────────────────────┘
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              │                           │                           │
              ▼                           ▼                           ▼
     ┌────────────────┐         ┌────────────────┐         ┌────────────────┐
     │  PostgreSQL    │         │  Redis         │         │  Object Store  │
     │  (primary)     │         │  (Upstash)     │         │  (médias S3/R2)│
     │  tables + blob │         │  rate limit    │         │  images/vidéos │
     └────────────────┘         │  cache L2*     │         └────────────────┘
                                └────────────────┘
                                          │
                                          ▼
                                ┌────────────────┐
                                │  Services ext. │
                                │  SMTP · PayDunya│
                                │  Web Push VAPID │
                                └────────────────┘

* Cache L2 Redis : phase 2 si > 3 instances ou latence PG > 50ms p95
```

### 2.2 Phases de montée en charge

| Phase | Trafic/mois | Infrastructure | Coût estimé |
|-------|-------------|----------------|-------------|
| **Lancement** | 500–2 000 visites | 1 VPS (2 vCPU, 4 GB) + PG managé + Cloudflare Free | ~30–50 $/mois |
| **Croissance** | 5 000–20 000 | 2 instances + PG + Upstash Redis + backups auto | ~80–150 $/mois |
| **Mobilisation** | 50 000+ | LB + 3+ instances + PG read replica + CDN médias | ~300+ $/mois |

---

## 3. Structure des composants

### 3.1 Couches applicatives (Clean Architecture)

```
src/
├── app/                          # PRÉSENTATION — routes, layouts, API handlers
│   ├── (site)/                   # Pages publiques RSC
│   ├── admin/                    # Dashboard admin (CSR + API)
│   └── api/                      # 38 routes REST
│
├── components/                   # UI React (sans logique métier)
│
├── domain/                       # DOMAINE — entités, erreurs, ports
│   ├── entities/                 # News, User, LiveEvent, Store…
│   ├── errors/                   # DomainError + codes
│   └── ports/                    # StorePort, EmailPort, PaymentPort
│
├── application/                  # APPLICATION — use-cases
│   └── services/                 # contact, member, donation, live, admin…
│
└── infrastructure/               # INFRASTRUCTURE — adapters concrets
    ├── persistence/              # store.impl, db-adapter, pg-sync
    ├── repositories/             # 6 repositories par agrégat
    ├── cache/                    # Data Cache + invalidation
    ├── auth/                     # sessions HMAC, bcrypt
    ├── email/                    # nodemailer
    ├── payment/                  # PayDunya
    ├── rate-limit/               # mémoire + Redis Upstash
    └── http/                     # api-response standardisé
```

### 3.2 Règle de dépendance

```
presentation → application → domain ← infrastructure
```

Le domaine ne connaît ni Next.js, ni PostgreSQL, ni Redis.

### 3.3 Agrégats métier

| Agrégat | Repository | Tables PG | Phase |
|---------|------------|-----------|-------|
| Contenu | `content.repository` | news, studies, campaigns… | V1 |
| Membres | `users.repository` | users, password_reset_tokens | V2 |
| Famille | `family-links.repository` | family_links | V2 |
| Dons | `donations.repository` | donations | V2 |
| Pétitions | `petitions.repository` | petitions, petition_signatures | V2 |
| Live | `live.repository` | live_events, live_chat_messages, live_polls | V3 |

---

## 4. Flux de données

### 4.1 Lecture contenu public (SSR)

```
Navigateur
    │ GET /
    ▼
Cloudflare (cache HTML si stale-while-revalidate)
    ▼
Next.js RSC HomePage
    │ getPublishedNewsCached()  ← unstable_cache (tag: cfm:news)
    ▼
content.repository → getStore() → fileStoreCache / pgStoreCache
    ▼
PostgreSQL (hydratation au boot si DATABASE_URL)
```

**Latence cible** : p95 < 200 ms TTFB (avec cache chaud).

### 4.2 Écriture formulaire (ex. adhésion)

```
Client POST /api/membership
    ▼
middleware.ts → rate limit Redis (30 req/min/IP)
    ▼
route.ts → Zod validation
    ▼
contact.service → content.repository.addMembership()
    ▼
StorePort.write() → store.impl
    ├── mutation mémoire (fileStoreCache)
    └── saveStoreToPostgres() [async, transaction FOR UPDATE]
    ▼
jsonSuccess()
```

### 4.3 Paiement Mobile Money (PayDunya)

```
Client POST /api/donations
    ▼
donation.service → PayDunya API (invoice)
    ▼
Redirect utilisateur → paiement opérateur
    ▼
PayDunya POST /api/donations/webhook
    ▼
Vérification HMAC PAYDUNYA_WEBHOOK_SECRET
    ▼
donations.repository → status = completed
```

### 4.4 Admin — modification contenu

```
Admin POST /api/admin/news
    ▼
auth.service (session cookie HMAC)
    ▼
admin.service → content.repository.adminCreate()
    ▼
updateStore() + saveStoreToPostgres()
    ▼
invalidateContentCache('news') → revalidateTag('cfm:news')
    ▼
Prochaine requête SSR : cache miss → données fraîches
```

### 4.5 Live chat (temps réel V3)

```
Client polling GET /api/live/[slug]/chat (3–5 s)
    ▼
live.service → live.repository
    ▼
PostgreSQL live_chat_messages (index live_event_id)
```

> **Évolution** : WebSocket/SSE via service dédié si > 500 viewers simultanés.

---

## 5. Conception API

### 5.1 Conventions

| Aspect | Standard CFM |
|--------|--------------|
| Format | JSON `application/json` |
| Succès | `{ "success": true, ...data }` ou objet direct (GET) |
| Erreur | `{ "error": "message lisible" }` + code HTTP |
| Validation | Zod schemas dans `src/lib/validators/` |
| Auth admin | Cookie `cfm_admin_session` (HMAC) |
| Auth membre | Cookie `cfm_member_session` (HMAC + userId) |
| Rate limit | 30 POST/min/IP sur endpoints sensibles |

### 5.2 Catalogue API (extrait)

#### Public — lecture

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/health` | Sonde liveness/readiness (LB, K8s) |
| GET | `/api/actions` | Actions par province |
| GET | `/api/petitions` | Pétitions actives |
| GET | `/api/live` | Événements live |
| GET | `/api/live/[slug]` | Détail événement |
| GET | `/api/live/[slug]/chat` | Messages chat (polling) |

#### Public — écriture

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/contact` | — | Message contact |
| POST | `/api/newsletter` | — | Inscription newsletter |
| POST | `/api/membership` | — | Adhésion (3 types) |
| POST | `/api/help` | — | Demande d'aide (chiffrée) |
| POST | `/api/donations` | — | Initier don Mobile Money |
| POST | `/api/petitions/[slug]` | — | Signer pétition |
| POST | `/api/member/register` | — | Créer compte membre |
| POST | `/api/member/login` | — | Connexion membre |

#### Membre (session requise)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | `/api/member/me` | Profil courant |
| PATCH | `/api/member/me` | Mise à jour profil |
| POST | `/api/member/family` | Lien parent/enfant |
| POST | `/api/member/logout` | Déconnexion |

#### Admin (session requise)

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/admin/login` | Connexion admin |
| GET | `/api/admin/stats` | Tableau de bord |
| GET/POST | `/api/admin/news` | CRUD actualités |
| PATCH | `/api/admin/data` | Mise à jour statuts |
| POST | `/api/admin/media` | Upload médias |

#### Webhooks

| Méthode | Route | Sécurité |
|---------|-------|----------|
| POST | `/api/donations/webhook` | HMAC PayDunya |

### 5.3 Codes d'erreur métier

| Code | HTTP | Cas |
|------|------|-----|
| `ALREADY_EXISTS` | 409 | Email newsletter déjà inscrit |
| `ALREADY_SIGNED` | 409 | Pétition déjà signée |
| `UNAUTHORIZED` | 401 | Session invalide |
| `NOT_FOUND` | 404 | Ressource absente |
| `PARENTAL_CONSENT_REQUIRED` | 400 | Mineur sans consentement |

---

## 6. Schéma base de données

### 6.1 Modèle relationnel (PostgreSQL)

Le schéma complet est dans `scripts/schema.sql`. Résumé par domaine :

```
store_meta (counters JSONB)
│
├── V1 Contenu
│   ├── news, studies, campaigns, partners, testimonials
│   ├── actions, press_releases, site_settings
│   └── memberships, help_requests, newsletter, contact_messages
│
├── V2 Communauté
│   ├── users (email UNIQUE, password_hash bcrypt)
│   ├── family_links (parent ↔ child, status workflow)
│   ├── donations (amount, provider, transaction_id)
│   ├── petitions + petition_signatures (UNIQUE petition+email)
│   ├── help_request_updates
│   └── password_reset_tokens
│
├── V3 Mobilisation
│   ├── live_events, live_chat_messages
│   ├── live_polls, live_poll_votes (UNIQUE poll+voter_key)
│   └── push_subscriptions
│
├── app_state (JSONB blob — compat migration)
└── admin_audit_log (BIGSERIAL, metadata JSONB)
```

### 6.2 Index critiques

```sql
CREATE UNIQUE INDEX idx_news_slug ON news(slug);
CREATE UNIQUE INDEX idx_newsletter_email ON newsletter(lower(email));
CREATE UNIQUE INDEX idx_petition_sig_unique ON petition_signatures(petition_id, lower(email));
CREATE INDEX idx_users_email ON users(lower(email));
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_help_requests_status ON help_requests(status);
CREATE INDEX idx_admin_audit_created_at ON admin_audit_log(created_at DESC);
```

### 6.3 Concurrence écritures

```sql
BEGIN;
SELECT id FROM app_state WHERE id = 1 FOR UPDATE;
-- mutation + sync tables normalisées
COMMIT;
```

Pattern implémenté dans `db-adapter.ts` : verrou pessimiste sur `app_state` pour éviter les lost updates multi-instances.

### 6.4 Données sensibles

| Table | Champ | Protection |
|-------|-------|------------|
| `help_requests` | `data` JSONB | AES-256-GCM (`DATA_ENCRYPTION_KEY`) |
| `users` | `password_hash` | bcrypt (cost 10) |
| `donations` | `phone` | Accès admin uniquement |

---

## 7. Stratégie de cache

### 7.1 Niveaux de cache

```
L0 — CDN Cloudflare
     Pages statiques, /_next/static, images public/media
     TTL : 1 an (assets hashés), 5 min (HTML avec stale-while-revalidate)

L1 — Next.js Data Cache (unstable_cache)
     Contenu public SSR : news, studies, campaigns, testimonials, actions
     Tags : cfm:news, cfm:studies, cfm:campaigns, cfm:content (global)
     TTL : 300 s (5 min) + invalidation à l'écriture admin

L2 — Cache process (in-memory)
     fileStoreCache / pgStoreCache dans store.impl.ts
     Durée de vie : process lifetime
     Invalidation : chaque write() rafraîchit le cache

L3 — Redis (Upstash REST)
     Rate limiting distribué (clé cfm:rl:{ip}:{endpoint})
     Futur : cache session, compteurs live viewers
```

### 7.2 Invalidation

| Événement | Action |
|-----------|--------|
| Admin crée/modifie/supprime contenu | `revalidateTag('cfm:news')` etc. |
| Bootstrap PG au démarrage | Hydratation L2, L1 expire naturellement |
| Déploiement | Cache L1 vidé (nouveau build) ; L2 reconstruit |

### 7.3 Ce qu'on ne cache pas

- Sessions auth (cookies HttpOnly)
- Données membre (`/api/member/me`)
- Formulaires et webhooks
- Chat live (polling temps réel)
- Admin dashboard

---

## 8. Déploiement production

### 8.1 Stack Docker (développement local / staging)

```bash
docker compose up -d          # PostgreSQL + Redis
cp .env.example .env.local    # Configurer secrets
npm run bootstrap:pg          # Schéma + migration
npm run build && npm start
```

Fichiers : `docker-compose.yml`, `Dockerfile`, `.dockerignore`

### 8.2 Variables obligatoires (production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
SESSION_SECRET=<64+ chars aléatoires>
ADMIN_PASSWORD=<fort>
DATA_ENCRYPTION_KEY=<32+ chars>
NEXT_PUBLIC_SITE_URL=https://cfmasbl.com
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

### 8.3 Health checks

```
GET /api/health → 200 { status: "ok", checks: { database, redis } }
```

Utilisé par : load balancer, Docker HEALTHCHECK, CI smoke.

### 8.4 Sauvegardes

| Ressource | Fréquence | Rétention |
|-----------|-----------|-----------|
| PostgreSQL (`pg_dump -Fc`) | Quotidienne | 7j / 4sem / 3mois |
| Médias (`public/media/`) | Hebdomadaire | 4 semaines |
| `data/store.json` (fallback) | Avant chaque migration | 30 jours |

---

## 9. Sécurité

| Couche | Mesure |
|--------|--------|
| Transport | HTTPS obligatoire (Cloudflare) |
| Headers | CSP, X-Frame-Options, nosniff (`next.config.ts`) |
| Auth | HMAC session + bcrypt passwords |
| API | Rate limit 30/min, Zod validation |
| Données | AES help_requests, audit log admin |
| Webhooks | HMAC PayDunya |
| Secrets | Fail-fast si manquants en prod (`config.ts`) |

---

## 10. Observabilité

| Signal | Outil recommandé | Phase |
|--------|------------------|-------|
| Logs structurés | stdout → journald / Datadog | Lancement |
| Métriques | `/api/health` + PG stats | Lancement |
| Erreurs | Sentry (client + server) | Croissance |
| APM | Datadog traces | Mobilisation |
| Alertes | Uptime sur /api/health | Lancement |

---

## 11. Roadmap technique

| Priorité | Item | Déclencheur |
|----------|------|-------------|
| P0 | PostgreSQL prod + backups | Avant mise en ligne réelle |
| P0 | Redis rate limit | Multi-instances ou spam |
| P1 | Data Cache contenu (implémenté) | Trafic > 1 000 visites/jour |
| P1 | Object storage médias (R2/S3) | > 5 GB médias |
| P2 | Read replica PG | Requêtes lecture > 100 ms p95 |
| P2 | WebSocket live chat | > 200 viewers simultanés |
| P3 | Extraction service paiements | Volume > 1 000 tx/mois |

---

## 12. Références

| Document | Contenu |
|----------|---------|
| `PLAN.md` | Spécification produit V1–V3 |
| `archive/Strat_Refact.md` | Plan refactor R0–R7 |
| `scripts/schema.sql` | DDL PostgreSQL |
| `docs/runbook.md` | Procédures ops |
| `docs/adr/` | Décisions architecture (ADR 0001–0004) |
