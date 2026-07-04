# Runbook — Design & médias (admin CFM)

Guide pour gérer tous les visuels du site sans toucher au code.

## Accès

1. Ouvrir `/admin` et se connecter (`ADMIN_PASSWORD` dans `.env.local`).
2. Menu latéral → **Design & médias**.

## Onglets

### Accueil & hero

- **Hero desktop / mobile** : image de fond de la bannière d'accueil.
- **Vidéo hero** : fichier MP4 (optionnel) + **poster** (image affichée avant lecture).
- **Image mission** : visuel de la section mission sur l'accueil.
- **Réinitialiser** : remet les valeurs par défaut du site.

### Bibliothèque

- Liste tous les fichiers uploadés (`/media/uploads/…`).
- **+ Upload** : images (JPG, PNG, WebP, SVG), PDF, MP4.
- Modifier le **texte alternatif (alt)** pour l'accessibilité.
- **Supprimer** : bloqué si le fichier est encore utilisé ailleurs.

### Collections

- **Galerie FIKIN** : photos de la section FIKIN (accueil, à propos). Ajouter, réordonner, supprimer.
- **Axes d'action** : une image par axe (social, économique, etc.).
- **Équipe** : photos des membres (à propos).
- **Images par défaut** : visuels de repli pour actualités, lives et témoignages sans image dédiée.

### Presse & documents

- **Dossier presse PDF** : fichier téléchargé depuis `/presse`.
- **Image Open Graph** : aperçu lors du partage sur les réseaux sociaux.

### Médias manquants

- Liste les contenus sans visuel (actualités, campagnes, lives, partenaires…).
- **Assigner** : ouvre le sélecteur de média et lie le fichier au contenu.

## MediaPicker (sélecteur)

Disponible dans :

- **Contenu** (actualités, campagnes, témoignages, études, presse) — bouton « Choisir média ».
- **Live** — bouton « Miniature » sur chaque événement.
- **Partenaires** — bouton « Choisir logo ».
- **Médias manquants** — assignation directe.

Actions : parcourir la bibliothèque ou uploader un nouveau fichier.

## Déploiement Netlify (démo)

- Les uploads sont stockés sur le disque du serveur **éphémère**.
- Un **redeploy** peut effacer les fichiers uploadés.
- Pour la production : prévoir VPS ou stockage objet (S3/R2) + base PostgreSQL persistante.

## Déploiement VPS (production)

- Volume Docker `cfm_media_uploads` — uploads persistants entre restarts
- PostgreSQL — `site_settings` (hero, defaults, catalog JSON)
- Variable `CFM_IMAGE_COMPRESS=true` — compression WebP automatique
- Checklist complète : [`docs/vps-media-deploy-checklist.md`](vps-media-deploy-checklist.md)
- Backup uploads : voir [`DEPLOY-VPS.md`](../DEPLOY-VPS.md)

## Vérification rapide

| Page | Ce qu'il faut vérifier |
|------|------------------------|
| `/` | Hero, mission, galerie FIKIN, axes, témoignages |
| `/axes` | Images des 5 axes |
| `/a-propos` | Galerie FIKIN, équipe |
| `/plaidoyer` | Couvertures actualités, images campagnes |
| `/presse` | Téléchargement du PDF |
| `/live` | Miniatures des événements |
| Partage social | Image OG (meta) |

## Dépannage

- **Upload échoue** : vérifier la taille du fichier (< 10 Mo recommandé) et le format.
- **Image ne s'affiche pas** : vider le cache navigateur ; en local, relancer `npm run dev`.
- **Fichier introuvable après deploy Netlify** : normal en démo — ré-uploader ou migrer vers VPS.

---

*CFM ASBL — Runbook Design & médias — juillet 2026*
