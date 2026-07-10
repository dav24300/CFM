# Release Notes — CFM ASBL v1.0.0-stabilisee

Date : 2026-07-07

## Inclus dans cette release

- Site public V1 complet (pages institutionnelles, formulaires, presse, légal)
- Espace membre V2 (auth, profil, liens familiaux, reset password)
- Mobilisation V2/V3 (pétitions, dons, live, chat, sondages, push PWA)
- Admin unifié avec connexion **admin ↔ site** (identité, pages CMS, partenaires, i18n FR/EN)
- Preview admin + invalidation cache par tags
- Tests E2E automatisés (18/18 admin→site, V1/V2/V3)
- CI GitHub Actions (typecheck, test, build)
- Persistance PostgreSQL (si `DATABASE_URL` configuré)

## Non inclus (reporté)

- Preprod miroir validée 48 h (ops)
- Déploiement production cfmasbl.com
- CSP stricte sans `unsafe-inline` / `unsafe-eval`
- Redis Upstash en production (`UPSTASH_*`)
- Webhook PayDunya testé avec clés production
- Suivi post-déploiement 72 h

## Risques résiduels

| Risque | Mitigation |
|--------|------------|
| Cache stale hors preview | Bouton preview admin ; TTL 300 s |
| Redis non configuré | Rate limit mémoire (mono-instance) |
| CSP permissive | Durcissement planifié post-release |
| PayDunya sans clés prod | Mode démo actif tant que non configuré |

## Déploiement

1. Variables : voir `.env.example`
2. `npm run bootstrap:pg` (si PostgreSQL)
3. `npm run build && npm run start` (VPS) ou `npm run deploy:vercel`
4. Valider : `npm run smoke` + `node scripts/test-admin-site-e2e.mjs`
5. Vérifier `/api/health` → `status: ok`

## Validation exécutée (local)

| Commande | Résultat |
|----------|----------|
| `npm run typecheck` | OK |
| `npm test` | OK — 70 tests |
| `npm run build` | OK — 68 pages |
| `test-admin-site-e2e.mjs` | OK — 18/18 |
| E2E V1/V2/V3 | OK |
