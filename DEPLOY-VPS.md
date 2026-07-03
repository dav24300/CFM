# Déploiement VPS — CFM ASBL

## Prérequis

- Docker + Docker Compose
- Domaine pointant vers le VPS (Cloudflare recommandé)
- Variables dans `.env.production` (copier depuis `.env.example`)

## Variables obligatoires

```env
POSTGRES_PASSWORD=<fort>
SESSION_SECRET=<64+ chars>
ADMIN_PASSWORD=<fort>
DATA_ENCRYPTION_KEY=<32+ chars>
NEXT_PUBLIC_SITE_URL=https://cfmasbl.com
```

## Déploiement rapide

```bash
npm run deploy:vps
docker compose -f docker-compose.prod.yml up -d --build
```

## Bootstrap PostgreSQL (première fois)

```bash
docker compose -f docker-compose.prod.yml exec app node scripts/bootstrap-pg.mjs
```

## Sauvegardes

```bash
DATABASE_URL=postgresql://... bash scripts/backup-db.sh
```

## Health check

```bash
curl https://cfmasbl.com/api/health
```

## Smoke tests post-déploiement

```bash
SMOKE_BASE_URL=https://cfmasbl.com npm run smoke
```
