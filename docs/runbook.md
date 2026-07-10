# Runbook Securite CFM

## Rotation `DATA_ENCRYPTION_KEY`

1. Generer une nouvelle cle de 32+ caracteres aleatoires.
2. Sauvegarder la cle actuelle dans le coffre-fort ops.
3. Basculer la variable `DATA_ENCRYPTION_KEY` sur la nouvelle valeur.
4. Redemarrer le service applicatif.
5. Verifier un parcours admin et un parcours `POST /api/help`.
6. Conserver l'ancienne cle uniquement pour restauration d'urgence.

## Bootstrap PostgreSQL (VPS)

1. Definir `DATABASE_URL` dans l'environnement.
2. Executer `npm run bootstrap:pg`.
3. Verifier les logs : schema applique, migration ok, hydration ok.

## Rate Limit Distribue (Upstash)

1. Definir :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
2. Redemarrer l'app.
3. Verifier qu'un spam de requetes API retourne `429`.

## Audit Admin

- Les actions admin sont journalisees :
  - `data/admin-audit.log`
  - table `admin_audit_log` (si PostgreSQL actif)

## Webhook PayDunya

1. Definir `PAYDUNYA_WEBHOOK_SECRET`.
2. Verifier l'en-tete `PAYDUNYA-SIGNATURE` sur les callbacks.
3. En cas de signature invalide, l'API renvoie `401`.

## Sauvegarde PostgreSQL

1. Export complet:
   - `pg_dump "$DATABASE_URL" -Fc -f backups/cfm-$(date +%F-%H%M).dump`
2. Verifier l'integrite:
   - `pg_restore -l backups/<fichier>.dump`
3. Conserver au moins:
   - 7 sauvegardes quotidiennes,
   - 4 sauvegardes hebdomadaires,
   - 3 sauvegardes mensuelles.

## Restauration PostgreSQL

1. Basculer l'application en maintenance.
2. Restaurer:
   - `pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" backups/<fichier>.dump`
3. Relancer l'application.
4. Verifier:
   - `npm run typecheck`
   - `npm run build`
   - parcours smoke minimum (`npm run smoke`).

## Procedure incident (degrade majeur)

1. Geler les changements (pas de deploy).
2. Capturer les symptomes:
   - logs app,
   - logs base,
   - dernier commit/deploy.
3. Evaluer rollback:
   - app uniquement, ou app + DB.
4. Appliquer rollback valide.
5. Verifier les routes critiques:
   - `/`, `/petitions`, `/contact`, `/api/member/login`, `/api/admin/login`.
6. Ouvrir une action post-mortem et lier l'ADR/commit correctif.

## Checklist securite (pre-release)

| Point | Verification | Statut local |
|-------|--------------|--------------|
| Sessions admin | `httpOnly`, `secure` prod, `sameSite: lax` | OK (code) |
| Rate limit API | 429 apres seuil sur POST sensibles | OK (`/api/contact`) |
| Webhook PayDunya | Signature invalide → 401 si cles configurees | A valider prod |
| Redis Upstash | `/api/health` → `redis: ok` | `skipped` sans `UPSTASH_*` |
| Chiffrement aide | `DATA_ENCRYPTION_KEY` requis | A confirmer prod |
| Audit admin | `data/admin-audit.log` + table PG | OK |
| CSP | Headers dans `next.config.ts` | `unsafe-inline` a durcir |

## Rollback applicatif

1. Basculer DNS / deploiement vers version precedente (Vercel rollback ou tag git).
2. Si migration DB : restaurer backup PostgreSQL (voir ci-dessus).
3. Verifier : `npm run smoke` + `node scripts/test-admin-site-e2e.mjs`.
4. Confirmer `/api/health` → `status: ok`.
