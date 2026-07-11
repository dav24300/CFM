# Ops — Ecarts stricts 100 % (actions manuelles)

## 1. Upstash Redis (rate limit distribue)

1. Creer une base Redis sur [Upstash](https://upstash.com)
2. Ajouter sur Vercel (Production + Preview) :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Redeployer
4. Verifier : `GET /api/health` → `"redis": "ok"`

## 2. PayDunya production

1. Ajouter sur Vercel :
   - `PAYDUNYA_MASTER_KEY`
   - `PAYDUNYA_PRIVATE_KEY`
   - `PAYDUNYA_TOKEN`
   - `PAYDUNYA_WEBHOOK_SECRET`
   - `MOBILE_MONEY_MODE=production`
2. Tester :
   ```bash
   PAYDUNYA_MASTER_KEY=xxx node scripts/test-paydunya-webhook-live.mjs https://cfm-asbl.vercel.app
   ```
3. Signature invalide doit retourner **401**

## 3. CSP durcie (sans unsafe-eval)

Deployee avec la branche `release/v1.0.0-stabilisee` (next.config.ts mis a jour).
Apres deploy, verifier :
```bash
curl -sI https://cfm-asbl.vercel.app | findstr content-security-policy
```
Ne doit plus contenir `unsafe-eval`.

## 4. Monitoring 48 h / 72 h

```bash
# Preprod 48 h
node scripts/monitor-stability.mjs https://cfm-asbl.vercel.app 48

# Production 72 h post-deploy
node scripts/monitor-stability.mjs https://cfm-asbl.vercel.app 72
```

## 5. Validation complete

```bash
# Backup prod (pooler Supabase) — requis pour check #4
CFM_BACKUP_DATABASE_URL="postgresql://..." node scripts/validate-strict-100.mjs https://cfm-asbl.vercel.app
```

Objectif : **8/8** checks verts.
