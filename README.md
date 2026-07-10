# CFM ASBL — Cri de Familles Militaires

Application Next.js 15 pour le site public, l'espace membre et l'administration de CFM ASBL.

## Architecture cible (juillet 2026 — Clean Architecture)

Couches explicites sous `src/` :

| Couche | Dossier | Role |
|--------|---------|------|
| Presentation | `src/app/`, `src/components/` | Pages RSC, API routes, UI |
| Application | `src/application/services/` | Use-cases (orchestration metier) |
| Domaine | `src/domain/` | Entites, erreurs, ports (interfaces) |
| Infrastructure | `src/infrastructure/` | Repositories, persistance, auth, email, paiement |
| Shared | `src/lib/` | Config, validators, i18n, barrels @deprecated |

Points cles :
- `src/infrastructure/persistence/` : StorePort, JSON store, sync PostgreSQL
- `src/infrastructure/repositories/` : 6 repositories par domaine
- `src/lib/validators/*` : schemas Zod pour validation API
- `src/lib/i18n/messages/*.json` : dictionnaires FR/EN/LN/SW
- `ResultatArchLog.md` : rapport detaille de la refactorisation

Persistance supportee:
- mode JSON local (`data/store.json`) pour dev simple
- mode PostgreSQL normalise pour production (recommande)

## Prerequis

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (optionnel en local, requis en production cible)

## Setup developpeur (< 30 min)

```bash
npm install
cp .env.example .env.local
```

Variables minimales locales:
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `DATA_ENCRYPTION_KEY`

Lancer l'application:

```bash
npm run dev
```

Administration locale: `http://localhost:3000/admin`

## Scripts principaux

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de developpement |
| `npm run typecheck` | Verification TypeScript |
| `npm run test` | Tests unitaires Vitest |
| `npm run test:coverage` | Couverture Vitest |
| `npm run test:repos` | Smoke tests legers historiques |
| `npm run build` | Build production |
| `npm run start` | Serveur production local |
| `npm run smoke` | Smoke routes HTTP (serveur deja demarre) |
| `npm run migrate:pg` | Migration JSON -> PostgreSQL |
| `npm run bootstrap:pg` | Bootstrap schema + migration/hydration |
| `npm run hydrate:pg` | Hydratation depuis PostgreSQL |
| `npm run export:i18n` | Regeneration dictionnaires JSON |
| `node scripts/test-admin-site-e2e.mjs` | E2E admin→site E1–E13 (18 tests) |
| `node scripts/verify-v1-content.mjs` | Validation contenu V1 |
| `node scripts/test-v2-petitions-e2e.mjs` | E2E pétitions V2 |
| `node scripts/test-v2-community.mjs` | E2E communauté V2 |
| `node scripts/test-v3-live-e2e.mjs` | E2E live V3 |
| `node scripts/validate-strict-100.mjs [url]` | Validation stricte 100 % (8 checks) |
| `node scripts/backup-restore-pg-test.mjs` | Backup PostgreSQL (Node) |
| `node scripts/monitor-stability.mjs [url] [hours]` | Monitoring sante 48h/72h |

## Qualite et CI

- Workflow CI: `.github/workflows/ci.yml`
- Gates obligatoires:
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run smoke` (apres `npm run dev` ou `npm run start`)
- E2E admin→site: `node scripts/test-admin-site-e2e.mjs` → **18/18**

## Documentation technique

- Plan produit: `PLAN.md`
- Analyse et stabilisation: `ANALYSE_ETAT_ACTUEL_LOGICIEL.md`
- Release notes: `RELEASE-NOTES.md`
- Tests admin↔site: `docs/TEST-ADMIN-SITE-E2E.md`
- Scope stabilisation: `docs/STABILISATION-SCOPE.md`
- Correctifs fonctionnels: `Corrective.md`
- Strategie de refactor: `Strat_Refact.md`
- Runbook ops/securite: `docs/runbook.md`
- ADR:
  - `docs/adr/0001-postgresql-normalized-persistence.md`
  - `docs/adr/0002-session-auth-hmac-and-bcrypt.md`
  - `docs/adr/0003-sensitive-data-encryption.md`
  - `docs/adr/0004-clean-architecture-layers.md`
- Rapport architecture: `ResultatArchLog.md`

## Deploiement

**Cible de production : Vercel (hebergement) + Supabase (PostgreSQL + Storage).**

1. Renseigner toutes les variables d'environnement sur Vercel (voir `.env.example`, source de verite unique). Variables **obligatoires** en prod : `SESSION_SECRET`, `ADMIN_PASSWORD`, `DATA_ENCRYPTION_KEY`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
   - Provisioning reproductible : `DATABASE_URL=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run setup:vercel-env`
2. Base de donnees : appliquer le schema + hydrater via `npm run bootstrap:pg`.
3. Bucket medias : `npm run setup:supabase-bucket`.
4. Deployer : `npx vercel --prod` (buildCommand `npm run build`, cf. `vercel.json`).
5. Verifier : `GET /api/health` doit renvoyer `database: ok` (et `redis: ok` si Upstash configure).

Option secondaire (self-hosting) : Docker/VPS via `output: standalone` (`Dockerfile`, `docker-compose.prod.yml`, `DEPLOY-VPS.md`). Non utilise pour la cible Vercel.
