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

## Qualite et CI

- Workflow CI: `.github/workflows/ci.yml`
- Gates obligatoires:
  - `npm run typecheck`
  - `npm run test`
  - `npm run build`
  - `npm run smoke` (apres `npm run start`)

## Documentation technique

- Plan produit: `PLAN.md`
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

- Netlify (preview): `DEPLOY-NETLIFY.md`
- VPS production: PostgreSQL + variables prod + HTTPS
