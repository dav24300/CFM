# P0 — Filet de sécurité (refactor persistance)

Date : 11/07/2026 · Branche : `refactor/persistence` (depuis `master` 09ee4fa, à jour d'origin)

## État de la production (tranché)

`vercel env pull --environment=production` exécuté le 11/07/2026 :
**`DATABASE_URL=""` (vide) en production.** La variable existe (chiffrée, créée ~04/07)
mais sa valeur est vide. Conséquences :

- **Aucune donnée de production à migrer.** Le chantier P1 se fait sans contrainte
  de migration de données prod.
- Le provisionnement Supabase (schema.sql + seed + séquences) est une étape de
  **go-live séparée**, hors périmètre P1 (voir mémoire projet « cfm-prod-deploy »).
- `CFM_PG_NORMALIZED` est défini en prod mais sans effet tant que `DATABASE_URL` est vide.

## Backups

- `backups/store-json-2026-07-11-211729.json` — copie de `data/store.json` (mode dev JSON).
- Backup PG local (docker `cfm-postgres`, port 5433) : voir `backups/cfm-db-*.json`
  (généré par `node scripts/backup-restore-pg-test.mjs`).
- Backup prod : sans objet (pas de base prod).

## Baseline (avant tout commit de code produit)

| Check | Résultat | Fichier |
|---|---|---|
| `npm run typecheck` | exit 0 | typecheck.txt |
| `npm test` (vitest) | 21 fichiers / 84 tests verts | vitest.txt |
| `npm run build` | exit 0 (standalone prêt) | build.txt |
| `npm run smoke` | (voir smoke.txt) | smoke.txt |
| e2e admin (13 scénarios) | (voir e2e-admin.txt) | e2e-admin.txt |
| Parité API | capture dans `api/` | api/*.json |
| Concurrence AVANT | (voir concurrency-before.txt) | concurrency-before.txt |

## Outils créés en P0

- `scripts/api-parity.mjs` — capture/diff des payloads API (gate de chaque commit P1).
- `scripts/test-concurrency.mjs` — preuve du lost update avant/après
  (`--allow-loss` pour la baseline, mode strict pour les gates).
