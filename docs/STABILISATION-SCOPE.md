# Scope de stabilisation finale — CFM ASBL

Date: 2026-07-07  
Statut: **Gelé** pour la phase de validation

## Périmètre inclus (release candidate)

- Site public V1 (pages institutionnelles, formulaires, newsletter, presse)
- Espace membre V2 (auth, profil, liens familiaux, reset password)
- Mobilisation V2/V3 (pétitions, dons, live, chat, sondages, push)
- Admin unifié (contenu, communauté, live, dons, exports, identité site, pages)
- i18n FR / EN / LN / SW (navigation + contenus principaux)
- Persistance JSON (dev) + PostgreSQL (si `DATABASE_URL` configuré)
- CI: typecheck, tests, build

## Hors périmètre (reporté post-validation)

- Déploiement production cfmasbl.com (fenêtre ops dédiée)
- Stabilisation preprod 48h (nécessite environnement miroir)
- Durcissement CSP (`unsafe-inline` / `unsafe-eval`)
- WebSocket temps réel (remplacement polling chat)
- Streaming Mux/LiveKit natif
- Traductions LN/SW certifiées par locuteurs natifs à 100 %
- SMS fallback notifications

## Définition « Ready for final validation »

1. `npm run typecheck` vert
2. `npm test` vert (sans erreur worker)
3. `npm run build` vert
4. `npm run smoke` vert (serveur local)
5. Scripts E2E V1/V2/V3 + admin→site verts
6. `/api/health` retourne `status: ok`
7. Aucun secret versionné
8. Dossier de validation documenté

## Rôles (indicatif)

| Rôle | Responsabilité |
|------|----------------|
| Technique | CI, corrections bloquantes, build |
| QA | smoke + E2E + non-régression |
| Contenu | vérification pages admin→site |
| Ops | env prod, backups, déploiement |
