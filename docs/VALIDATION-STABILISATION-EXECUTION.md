# Exécution du plan de stabilisation — CFM ASBL

Date d'exécution: 2026-07-07  
Référence: `ANALYSE_ETAT_ACTUEL_LOGICIEL.md` section 9

## Actions réalisées

### Phase 0 — Cadrage
- Scope gelé documenté dans `docs/STABILISATION-SCOPE.md`
- Définition « Ready for final validation » fixée

### Phase 1 — Hygiène dépôt
- Suppression de `typecheck-out.txt` (artefact local)
- Ajout à `.gitignore`: `data/emails.log`, `typecheck-out.txt`
- Vérification secrets: `.env.example` seul fichier env suivi (OK)
- **Reste ouvert**: nombreux fichiers modifiés/non suivis (chantier admin/site en cours)

### Phase 2 — TypeScript et CI
- `npm run typecheck` → **OK**
- `npm test` → **OK** (70 tests, 18 fichiers) après correction `vitest.config.ts` (pool threads)
- `npm run build` → **OK** (Next.js 15.5.19, 68 pages statiques)
- CI GitHub (`.github/workflows/ci.yml`) alignée sur typecheck + test + build

### Phase 3 — Tests fonctionnels
- `npm run smoke` → **21/21 OK**
- `scripts/verify-v1-content.mjs` → **6/6 OK**
- `scripts/test-v2-petitions-e2e.mjs` → **OK**
- `scripts/test-v2-community.mjs` → **4/4 OK**
- `scripts/test-v3-live-e2e.mjs` → **OK**
- `scripts/test-admin-site-e2e.mjs` → **5/5 OK**

### Phase 4 — Sécurité
- Rate limiting `/api/contact` → **429 à la 31e requête** (OK)
- Sessions admin: cookies `httpOnly`, `secure` en prod, `sameSite: lax`
- Webhook PayDunya: rejet signature invalide (401 si clés configurées)
- CSP: `unsafe-inline` / `unsafe-eval` toujours présents (vigilance documentée)
- Audit admin: `data/admin-audit.log` + table PG si activée

### Phase 5 — Données
- `/api/health` → `{"status":"ok","checks":{"app":"ok","database":"ok","redis":"skipped"}}`
- Mode persistence: PostgreSQL actif en local (via `.env.local`)
- Backup/restore: procédure dans `docs/runbook.md` (non rejouée en live)

### Phase 6 — Preproduction
- **Non exécutée** (pas d'environnement preprod miroir disponible)
- Validation locale dev sur `http://localhost:3000` uniquement

### Phase 7 — Documentation
- Scope: `docs/STABILISATION-SCOPE.md`
- Ce rapport d'exécution
- Runbook existant: `docs/runbook.md`

### Phase 8 — Gate Go/No-Go
- Décision: **NO-GO conditionnel** (voir tableau de score)
- Bloquants résolus: typecheck, tests, build, smoke, E2E
- Bloquants restants: preprod 48h, dépôt non consolidé (git dirty)

### Phase 9 — Clôture
- En attente de gate GO définitif et tag release

## Preuves techniques (commandes)

```bash
npm run typecheck   # exit 0
npm test            # 70 passed
npm run build       # exit 0
npm run smoke       # All smoke tests passed
node scripts/test-admin-site-e2e.mjs  # 5/5
```

## Correctifs appliqués pendant l'exécution

| Fichier | Changement |
|---------|------------|
| `vitest.config.ts` | `pool: "threads"`, `maxWorkers: 1`, `teardownTimeout` |
| `.gitignore` | exclusion logs email + typecheck-out |
| `typecheck-out.txt` | supprimé |

## Risques résiduels acceptés (temporaire)

1. Dépôt avec modifications non commitées
2. Pas de preprod dédiée validée 48h
3. CSP non durcie
4. Redis rate limit non configuré (`redis: skipped` dans health)
