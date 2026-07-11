# ADR 0005 — SQL ciblé par agrégat, séquences PostgreSQL, fin du Store global

- **Date** : 2026-07
- **Statut** : Acceptée — **remplace ADR 0001**
- **Contexte** : refactor persistance P0+P1 (branche `refactor/persistence`),
  suite à l'audit d'architecture du 11/07/2026 (ZC-1 à ZC-5).

## Contexte

Le modèle ADR 0001 (Store global JSON + sync full-rewrite vers 28 tables
normalisées) présentait quatre défauts structurels sur la cible
Vercel + Supabase :

1. **Lost updates** : chaque écriture clonait le Store entier puis réécrivait
   toute la base (TRUNCATE + réinsertion) — deux écritures concurrentes
   s'écrasaient (preuve : 50 écritures perdues sur 5 runs de
   `scripts/test-concurrency.mjs` avant refactor).
2. **Coût O(taille de la base)** par écriture — incompatible timeout serverless.
3. **Multi-instances** : cache process (`pgStoreCache`) jamais invalidé,
   compteur d'ID global en mémoire → lectures figées, collisions de PK.
4. **Fallback JSON silencieux** vers `data/store.json` (éphémère sur Vercel)
   à la première erreur PG, pour toute la vie du process.

## Décision

1. **SQL ciblé par agrégat** : chaque repository émet ses propres requêtes
   (modules `src/infrastructure/repositories/sql/*.sql.ts`) derrière les mêmes
   signatures de fonctions. Transactions par agrégat (signature de pétition =
   INSERT + UPDATE compteur ; vote de sondage = INSERT + recalcul options sous
   FOR UPDATE ; reset de mot de passe = token + hash dans une transaction).
   Les contraintes UNIQUE de la base font l'anti-doublon (23505 → codes
   domaine via `sql/pg-errors.ts`).
2. **Dual-mode** : `if (isPgMode())` → SQL ; sinon branche Store historique
   (mode dev JSON sans `DATABASE_URL`, `data/store.json`). En mode PG, le
   `store.factory` sert un **garde-fou** qui lève `PERSISTENCE_ERROR` — plus
   aucun chemin runtime ne lit/écrit le Store.
3. **Séquences PostgreSQL par table** (`<table>_id_seq`, bloc DO idempotent
   et monotone en fin de `scripts/schema.sql`, seuil
   `GREATEST(max(id), compteur global historique, 100)`) remplacent `nextId`.
   Type `number` conservé côté API.
4. **Plus de fallback JSON en prod** : erreur PG → `PERSISTENCE_UNAVAILABLE`
   (503) via `handleDomainError`. Récupération immédiate au retour de PG
   (plus de flag à vie du process).
5. **Seeds one-shot** : `store_meta.seed_version` + verrou advisory
   (`claimSeedVersion`), hooks SQL par agrégat (`sql/seed-hooks.ts`), déclenchés
   au démarrage serveur (`src/instrumentation.ts`). Plus de re-seed sur
   `length === 0` (fin de la résurrection des données supprimées).
6. **`app_state` figé** : plus jamais écrit au runtime — artefact historique
   et de migration. `CFM_PG_NORMALIZED` retiré.
7. **`pg-sync.ts` = module scripts uniquement** : `migrate-json-to-pg.mjs`
   (provisionnement, `saveStoreToTables({includeMigrated: true})`) et
   `hydrate-from-postgres.mjs` (`loadStoreFromTables`).
8. **Cache** : couche unique `unstable_cache` + `revalidateTag` (tags posés
   par les repositories, inchangés). `pgStoreCache` supprimé.

## Conséquences

- Une signature de pétition = 1 INSERT + 1 UPDATE dans une transaction —
  tenue de charge d'une pétition virale, plus de lost update
  (0 perte sur les runs stricts de `test-concurrency.mjs`).
- Sur panne PG, le site lit son cache Next et refuse proprement les écritures
  (503 « réessayez ») au lieu de perdre des données en silence.
- Provisionnement d'une base neuve : `scripts/schema.sql` +
  `DATABASE_URL=... npx tsx scripts/migrate-json-to-pg.mjs` (écrit toutes les
  tables, y compris migrées) ; backup canonique : `npm run backup:pg`.
- Rollback par agrégat pendant la transition : `git revert` du commit +
  `scripts/resync-counter.mjs` si retour au compteur global (période close au
  tag `v-p1-final`).

## Références

- Baselines et preuves : `docs/refactor-baseline/` (concurrence avant/après,
  parité API 27 endpoints, e2e 18/18).
- Gates par commit : typecheck, vitest, intégration PG
  (`__tests__/integration/*.pg.test.ts` sur `TEST_DATABASE_URL`), build,
  smoke, `scripts/api-parity.mjs diff`, e2e ciblé, `scripts/test-concurrency.mjs`.
