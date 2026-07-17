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
CFM_IMAGE_COMPRESS=true
CFM_MEDIA_CACHE_TTL=300
```

## Volume médias (uploads admin)

Le service `app` monte le volume Docker `cfm_media_uploads` sur `/app/public/media/uploads`.
Les fichiers uploadés via l'admin **survivent** aux redémarrages du container.

### Backup uploads

```bash
# Depuis le VPS — copie du volume vers backup local
docker run --rm -v cfm_cfm_media_uploads:/data -v $(pwd)/backups:/backup alpine \
  tar czf /backup/cfm-media-$(date +%Y%m%d).tar.gz -C /data .
```

Restauration :

```bash
docker run --rm -v cfm_cfm_media_uploads:/data -v $(pwd)/backups:/backup alpine \
  tar xzf /backup/cfm-media-YYYYMMDD.tar.gz -C /data
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

## Checklist persistance médias (post-deploy)

Voir [`docs/vps-media-deploy-checklist.md`](docs/vps-media-deploy-checklist.md) pour la validation complète Design & médias en production.
