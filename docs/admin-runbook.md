# Runbook admin CFM ASBL

Guide rapide pour le fondateur / bénévole admin.

## Connexion

1. Aller sur `/admin`
2. Mot de passe défini dans `ADMIN_PASSWORD` (Vercel)
3. Dashboard : `/admin/dashboard`

## Workflows quotidiens

| Tâche | Section admin | Délai cible |
|-------|---------------|-------------|
| Nouvelle demande d'aide | Boîte de réception → Aide | < 2 min pour ouvrir |
| Activer un membre | Communauté | < 24 h |
| Publier une actualité | Contenu → Actualités → Publier | < 5 min visible site |
| Modérer chat live | Live → badge orange → Modérer | Temps réel si Pusher configuré |
| Valider un don | Dons & transparence | Après webhook PayDunya |

## Persistance production

- Les modifications sont enregistrées dans **Supabase PostgreSQL**
- Le site public se met à jour sous ~30 s (cache invalidé automatiquement)
- Vérifier `/api/health` → `database: ok`

## Upload médias

- Section **Médias & design**
- Sur Vercel : fichiers dans Supabase Storage (`media-uploads`)
- Voir [`admin-upload-troubleshooting.md`](admin-upload-troubleshooting.md)

## Live & chat temps réel

Configurer Pusher (voir [`VERCEL-ENV-CHECKLIST.md`](VERCEL-ENV-CHECKLIST.md)) :
- Sans Pusher : polling 3 s
- Avec Pusher : badge « temps réel » sur le chat public

## Dons Mobile Money

1. Configurer `PAYDUNYA_*` et `MOBILE_MONEY_MODE=production`
2. Tester un petit montant
3. Webhook : `/api/donations/webhook`

## Emails

Configurer `SMTP_*` (Brevo recommandé). Avec `CFM_REQUIRE_SMTP=true`, aucun email ne part en log silencieux.

## Sauvegarde

- Supabase Dashboard → Backups
- Ou `npm run backup:db` (machine avec accès `DATABASE_URL`)

---

*CFM ASBL — juillet 2026*
