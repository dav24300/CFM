# Tests E2E — Connexion Admin ↔ Site (E1–E13)

## Prérequis

- `npm run dev` actif sur `http://localhost:3000`
- Mot de passe admin dans `.env.local` (`ADMIN_PASSWORD`)
- PostgreSQL hydraté si `DATABASE_URL` est défini

## Exécution automatisée

```bash
node scripts/test-admin-site-e2e.mjs
```

Résultat attendu : **18/18** (scénarios E1–E13 + login).

## Scénarios couverts

| # | Action admin | Vérification site |
|---|--------------|-------------------|
| E1 | Créer actualité publiée | Homepage + `/actualites/[slug]` |
| E2 | Modifier `hero_image_alt` | Homepage (attribut alt hero) |
| E3 | Ajouter partenaire | Footer |
| E4 | Changer email identité | `/contact` |
| E5 | Override i18n `nav.about` FR + EN | Header (cookies locale) |
| E6 | Créer / dépublier pétition | `/petitions` |
| E7 | Créer et démarrer live | `/live` + homepage |
| E8 | Toggle `donors_public` | `/s-engager` |
| E9 | Modifier `social_links` | Footer |
| E10 | Créer action territoire | `/actions` |
| E11 | Modifier timeline CMS | `/a-propos` |
| E12 | Modifier markdown légal | `/confidentialite` |
| E13 | Preview après save | Changement visible < 5 s |

## Preview

`POST /api/admin/preview` avec tags cache (`cfm:site-config`, `cfm:content`, etc.) avant lecture des pages publiques.

## Batterie complète (stabilisation)

```bash
npm run smoke
node scripts/verify-v1-content.mjs
node scripts/test-v2-petitions-e2e.mjs
node scripts/test-v2-community.mjs
node scripts/test-v3-live-e2e.mjs
node scripts/test-admin-site-e2e.mjs
```

## Prod

Répéter E1, E3, E4, E5, E13 sur l'URL de production après déploiement.
