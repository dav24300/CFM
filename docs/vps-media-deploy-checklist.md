# Checklist — Déploiement VPS & persistance médias

Utiliser cette checklist après chaque déploiement production VPS.

## Pré-déploiement

- [ ] `.env.production` complet (POSTGRES, SESSION, ADMIN, ENCRYPTION, SITE_URL)
- [ ] `CFM_IMAGE_COMPRESS=true` activé sur VPS
- [ ] Volume `cfm_media_uploads` présent dans `docker-compose.prod.yml`
- [ ] DNS + HTTPS (Cloudflare ou reverse proxy)

## Déploiement

```bash
npm run deploy:vps
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml exec app node scripts/bootstrap-pg.mjs  # première fois
curl https://<domaine>/api/health
SMOKE_BASE_URL=https://<domaine> npm run smoke
```

## Validation fonctionnelle (fondateur)

| # | Action admin | Vérification publique |
|---|--------------|----------------------|
| 1 | Upload hero desktop | `/` — bannière mise à jour |
| 2 | Upload image mission | `/` — bloc mission |
| 3 | Modifier galerie FIKIN | `/`, `/a-propos` |
| 4 | Assigner cover actualité | `/plaidoyer`, `/actualites/[slug]` |
| 5 | Upload PDF presse | `/presse` — téléchargement OK |
| 6 | Miniature live | `/live` |
| 7 | Logo partenaire (édition) | Admin Partenaires |
| 8 | Favicon + OG | Partage social + onglet navigateur |

## Validation persistance

| # | Test | Résultat attendu |
|---|------|------------------|
| 1 | Redémarrer container `app` | Uploads toujours visibles |
| 2 | Redémarrer PostgreSQL | `site_settings` conservés |
| 3 | Journal audit admin | Entrées upload/assign/patch |

```bash
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml restart postgres
```

## Backup recommandé

- PostgreSQL : `scripts/backup-db.sh` (quotidien)
- Médias uploads : voir `DEPLOY-VPS.md` section backup volume

---

*CFM ASBL — Checklist VPS médias — juillet 2026*
