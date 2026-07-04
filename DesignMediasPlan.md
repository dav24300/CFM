# DesignMedias — Plan d'exécution complet

> **Date** : juillet 2026  
> **Objectif** : porter la section admin **« Médias & design »** de ~25 % à **100 %** de couverture pour piloter **tous** les visuels diffusés sur le site public CFM ASBL  
> **Périmètre** : analyse + plan uniquement — **aucune modification de code** dans ce livrable  
> **Références** : `WEBDESIGN.md` §5–9, `AdminRecovery.md` Phase F, code actuel `AdminDesignPanel`, `media.ts`, `media.server.ts`

---

## 1. Synthèse exécutive

### 1.1 Constat

Le panneau **Design & médias** (`AdminDesignPanel`) occupe aujourd'hui le `<main>` de la section admin `design`, mais ne gère que **4 clés** dans `site_settings` :

| Clé | Libellé admin | Diffusion site |
|-----|---------------|----------------|
| `hero_image` | Image hero accueil | Accueil (`HeroMedia` poster / fallback image) |
| `hero_poster` | Poster vidéo hero | Accueil (poster vidéo) |
| `hero_video` | Vidéo hero MP4/WebM | Accueil (loop si connexion rapide) |
| `mission_image` | Image section mission | Accueil (bloc mission) |

**Couverture estimée** : **~25 %** des besoins médias du site (cf. inventaire `WEBDESIGN.md` §5.1).

Le reste des visuels est soit :

- **hardcodé** dans `src/lib/media.ts` (`MEDIA` constant),
- **versionné** dans `public/media/` (SVG placeholders + quelques PNG),
- **lié au contenu** via champs entité (`cover_image`, `image_url`, `file_url`, `thumbnail`, `photo`) **sans UI média dédiée** dans Contenu / Live / Partenaires,
- **hors admin** (scripts CLI `import-cfm-images.mjs`, `generate-media-placeholders.mjs`).

### 1.2 Vision cible

> **Un centre médias unique** dans l'admin : le `<main>` Design & médias devient le **hub de diffusion visuelle** du site — catalogue, upload, remplacement, preview live, métadonnées accessibilité, et liens vers les entités qui consomment chaque asset.

Principe : **une source de vérité par type d'asset**, avec preview **avant publication** et indication **où l'asset apparaît** sur le site.

### 1.3 Score cible

| Zone | Avant | Après |
|------|-------|-------|
| Hero & mission (accueil) | 70 % | 100 % |
| Galerie FIKIN / À propos | 0 % | 100 % |
| Axes (×5) | 0 % | 100 % |
| Équipe (fondateur, bénévoles) | 0 % | 100 % |
| Defaults (actu, live, témoignages) | 0 % | 100 % |
| Assets par entité (news, campagnes, etc.) | 15 % | 100 % |
| Presse (dossier PDF) | 0 % | 100 % |
| Identité (favicon, PWA, OG) | 0 % | 80 % |
| Pipeline (compression, alt, audit) | 10 % | 90 % |

**Score global section Design & médias** : **25 % → 100 %**

---

## 2. Cartographie — où les médias sont consommés

### 2.1 Pages publiques et dépendances

| Page / zone | Composants | Source média actuelle | Admin actuel |
|-------------|------------|----------------------|--------------|
| **Accueil** `/` | `HeroMedia`, `MediaCard`, `HomeAxesStrip`, `TestimonialCarousel`, live teaser | `getSiteMedia()` + `MEDIA.axes` + `cover_image` news + `getResolvedLiveThumb()` | 4 champs hero/mission seulement |
| **À propos** `/a-propos` | `ImageGallery`, portraits | `getResolvedGallery()` + `getResolvedAboutMedia()` → `MEDIA.fikinGallery`, `MEDIA.about` | Aucun |
| **Axes** `/axes` | cartes axe | `getAxisImage(slug)` → `MEDIA.axes` | Aucun |
| **Plaidoyer** `/plaidoyer` | `MediaCard`, études PDF | `cover_image`, `image_url`, `file_url` | Contenu (texte seul, pas upload cover) |
| **Actualités** `/actualites/[slug]` | cover pleine largeur | `cover_image`, `cover_image_alt` | Contenu (pas upload) |
| **Presse** `/presse` | communiqués, kit presse | `file_url` + `PRESS_KIT_PATH` hardcodé | Contenu + fichier statique `public/media/presse/` |
| **Live** `/live`, `/live/[slug]` | `MediaCard`, `LivePlayer` | `thumbnail` événement + `MEDIA.live.defaultThumb` | Live panel (pas thumbnail upload) |
| **Actions** `/actions` | `PageHero` | `MEDIA.fikinGallery[3]` | Aucun |
| **S'engager** `/s-engager` | `PageHero` | constantes / placeholders | Aucun |
| **Footer** | liens sociaux | `site_settings.social_links` (panneau **i18n**, pas design) | Hors section design |
| **Partenaires** (futur footer/presse) | logos | `partners.logo_url` | Section **Partenaires** (URL texte, pas upload) |
| **PWA** | manifest, favicon | `public/icon.svg`, `manifest.json` | Aucun |

### 2.2 Inventaire fichiers `public/media/`

```
public/media/
├── hero/              hero-home.svg, hero-home-mobile.svg  (+ PNG si import)
├── fikin-2025/        rassemblement-01..06.svg
├── axes/              social, economie, education, environnement, sante.svg
├── temoignages/       portrait-01, portrait-02.svg
├── equipe/            fondateur, benevoles.svg
├── live/              fikin-live-thumb.svg
├── actualites/        default.svg
├── presse/            dossier-presse.pdf
└── uploads/           fichiers admin (hero remplacés via API)
```

**Problème structurel** : `media.ts` référence des `.png` alors que le repo versionne surtout des `.svg` ; le resolver `pngToSvgFallback` masque l'absence de PNG en prod.

### 2.3 Modèle de données existant (prêt mais sous-exploité)

| Entité | Champs média | Rempli à la création admin ? | UI upload ? |
|--------|--------------|------------------------------|-------------|
| `site_settings` | `hero_*`, `mission_image`, `social_links`, `i18n_overrides` | hero/mission via API media | Partiel (4 clés) |
| `news` | `cover_image`, `cover_image_alt` | Non (`adminCreate` ignore) | Non |
| `studies` | `file_url` | Non | Non |
| `campaigns` | `image_url` | Non | Non |
| `press_releases` | `file_url` | Non | Non |
| `testimonials` | `photo`, `photo_alt`, `anonymous` | Non | Non |
| `actions` | `photo` (type existe) | Non | Non |
| `live_events` | `thumbnail`, `thumbnail_alt` | Non | Non |
| `partners` | `logo_url` | Manuel (URL) | URL seulement |
| Galerie FIKIN | — | Hardcodé `MEDIA.fikinGallery[]` | Non |
| Axes | — | Hardcodé `MEDIA.axes` | Non |
| Defaults | — | Hardcodé `MEDIA.news`, `MEDIA.live`, etc. | Non |

---

## 3. Audit technique de l'existant admin

### 3.1 `AdminDesignPanel.tsx` (état actuel)

**Forces**

- Upload fichier → `POST /api/admin/media` avec `settingKey`
- Preview image + vidéo hero
- Toasts via contexte parent (`AdminToastProvider`)
- Skeleton loading

**Limites**

| Limite | Impact |
|--------|--------|
| 4 cartes en grille 2 colonnes, pas de tabs | Le `<main>` n'exploite pas la hauteur/largeur (640×780 observé) |
| Pas de hero **mobile** dédié | `MEDIA.hero.imageMobile` jamais administrable |
| Pas de liste / bibliothèque médias | Impossible de réutiliser un upload |
| Pas d'indication « utilisé sur » | Fondateur ne sait pas où va l'image |
| Message d'aide obsolète (SVG seulement) | API accepte déjà MP4/WebM |
| Pas de gestion alt text | WCAG non couvert depuis design |
| Pas de suppression / restauration placeholder | Uploads orphelins dans `uploads/` |
| Feedback `message` local au lieu de toasts cohérents | UX incohérente vs reste admin |

### 3.2 API ` /api/admin/media`

| Méthode | Rôle | Gap |
|---------|------|-----|
| `GET` | 4 clés site_settings | Ne liste pas la bibliothèque ni les catégories |
| `POST` | Upload + assignation settingKey | Max 5 Mo, pas de Sharp/compression ; clés limitées à 4 |
| `PATCH` | Mise à jour chemins | Pas de métadonnées (alt, titre) |

**Stockage** : `public/media/uploads/{timestamp}-{random}.ext` + chemin dans `site_settings`.

### 3.3 Chevauchements avec autres sections admin

| Section admin | Chevauchement média | Décision cible |
|---------------|---------------------|----------------|
| **Contenu** | Covers actualités, campagnes, PDF presse | Design = **defaults + bibliothèque** ; Contenu = **picker** lié à l'entité |
| **Live** | Thumbnail événement | Live = assignation ; Design = default thumb live |
| **Partenaires** | Logo | Partenaires = upload logo ; Design = preview grille partenaires |
| **i18n** | `social_links` JSON | Rester i18n/constantes OU migrer bloc « Identité & liens » dans Design |

---

## 4. Architecture cible — le `<main>` Design & médias

### 4.1 Navigation interne (tabs desktop, pleine largeur)

```
🎨 Médias & design
├── 🏠 Accueil & hero          ← site_settings hero + mission + mobile
├── 🖼️ Bibliothèque            ← tous les fichiers uploadés + filtres
├── 📁 Collections
│   ├── Galerie FIKIN
│   ├── Axes (×5)
│   ├── Équipe
│   └── Defaults (actu / live / témoignage)
├── 📄 Presse & documents      ← dossier presse PDF + templates
├── 🧩 Par entité              ← raccourcis vers contenu avec filtre « sans visuel »
├── 🎨 Identité & PWA           ← favicon, manifest preview, couleurs (lecture seule V1)
└── ⚙️ Paramètres pipeline     ← limites taille, formats, nettoyage uploads
```

Le `<main class="flex-1 overflow-auto p-6">` doit passer d'une **grille 2×2** à un **layout pleine largeur** :

- **Colonne gauche (60 %)** : édition / upload / liste
- **Colonne droite (40 %)** : preview contextuelle (aperçu accueil, carte MediaCard, etc.)
- **Barre supérieure** : recherche bibliothèque, bouton « Actualiser », compteur assets

### 4.2 Pattern UX obligatoires (alignés `AdminRecovery.md` §5.2)

| Pattern | Application Design & médias |
|---------|----------------------------|
| Liste + détail | Clic asset → panneau détail (URL, taille, alt, usages) |
| Preview live | Miniature rendu réel (`<Image>` / `<video>`) |
| Toast succès/erreur | Chaque upload / remplacement / suppression |
| Confirm destructive | Supprimer asset utilisé → avertissement + liste des pages impactées |
| Empty state | « Aucune photo FIKIN — importer depuis bibliothèque » |
| Badge statut | `placeholder` / `production` / `manquant` |

---

## 5. Spécifications fonctionnelles détaillées

### 5.1 Bloc Accueil & hero (priorité P0)

| ID | Fonctionnalité | Détail technique | Pages impactées |
|----|----------------|------------------|-----------------|
| H1 | Image hero desktop | `site_settings.hero_image` | `/` |
| H2 | Image hero **mobile** | Nouvelle clé `hero_image_mobile` | `/` (responsive futur) |
| H3 | Poster vidéo | `hero_poster` | `/` `HeroMedia` |
| H4 | Vidéo loop | `hero_video`, max 5–10 Mo (augmenter limite ou compression) | `/` |
| H5 | Image mission | `mission_image` | `/` section mission |
| H6 | Textes alt | `hero_image_alt`, `mission_image_alt` (nouvelles clés) | Accessibilité |
| H7 | Preview composite | Simuler `HeroMedia` (vidéo + overlay + titre factice) | Admin seulement |
| H8 | Réinitialiser placeholder | Bouton « Restaurer défaut CFM » → chemin `MEDIA.*` | Rollback rapide |

### 5.2 Bibliothèque médias (priorité P0)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| B1 | Liste paginée tous fichiers `public/media/uploads/` + assets catalogués | GET `/api/admin/media/library` |
| B2 | Filtre type (image, vidéo, PDF), date, catégorie | |
| B3 | Upload multiple drag-and-drop | POST avec `category` optionnelle |
| B4 | Métadonnées : `alt`, `title`, `tags[]` | Table `media_assets` ou JSON dans `site_settings.media_catalog` |
| B5 | Copier URL publique | Bouton clipboard |
| B6 | Voir usages | Reverse lookup : quelles entités référencent ce path |
| B7 | Supprimer (si non utilisé) | DELETE avec garde-fou |

### 5.3 Collection Galerie FIKIN (priorité P1)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| G1 | CRUD items galerie (ordre, alt, src) | Remplacer hardcode `MEDIA.fikinGallery` par `site_settings.fikin_gallery` JSON ou table |
| G2 | Réordonnancement drag-and-drop | Ordre reflété sur `/a-propos` et sections accueil |
| G3 | Minimum 4, max 12 images | Validation |
| G4 | Import batch depuis `assets/incoming/` | Bouton admin déclenchant logique `import-cfm-images.mjs` |

**Pages** : `/`, `/a-propos`, `/actions` (hero), `/plaidoyer` (contexte).

### 5.4 Collection Axes ×5 (priorité P1)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| A1 | Une image par slug : `social`, `economique`, `education`, `environnement`, `sante` | `site_settings.axis_images` JSON map |
| A2 | Alt par axe | WCAG |
| A3 | Preview carte axe | Comme `HomeAxesStrip` / page `/axes` |

**Migration** : lire depuis `site_settings` avec fallback `MEDIA.axes`.

### 5.5 Collection Équipe (priorité P1)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| E1 | Photo fondateur | `site_settings.about_founder` ou clé dédiée |
| E2 | Photo équipe / bénévoles | `site_settings.about_team` |
| E3 | Légendes | alt text |

**Pages** : `/a-propos`, potentiellement `/s-engager`.

### 5.6 Defaults globaux (priorité P1)

| ID | Asset | Clé proposée | Usage fallback |
|----|-------|--------------|----------------|
| D1 | Vignette actualité default | `default_news_cover` | `getResolvedNewsCover(null)` |
| D2 | Thumbnail live default | `default_live_thumb` | `getResolvedLiveThumb(null)` |
| D3 | Portrait témoignage 1 / 2 | `default_testimonial_1/2` | `TestimonialCarousel` |
| D4 | Portrait anonyme | `default_testimonial_anonymous` | témoignages anonymes |

### 5.7 Presse & documents (priorité P2)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| P1 | Upload **dossier presse PDF** | Remplace `public/media/presse/dossier-presse.pdf` ; chemin dans `site_settings.press_kit_url` |
| P2 | PDF par communiqué | Déjà `press_releases.file_url` — lien depuis Design « documents sans fichier » |
| P3 | Preview première page PDF | Optionnel (image preview générée) |

### 5.8 Pont entités contenu (priorité P1 — coordination Contenu)

Le Design & médias ne remplace pas le CRUD contenu, mais fournit :

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| C1 | Widget « Contenus sans visuel » | Liste news/campagnes/studies/testimonials/live sans image |
| C2 | Media Picker modal réutilisable | Composant partagé `MediaPicker` appelé depuis `ContentPanel` et `AdminV3Panel` |
| C3 | Upload inline depuis picker | Upload → sélection auto du path dans le formulaire entité |
| C4 | Champs manquants formulaires | `cover_image` + `cover_image_alt` news ; `image_url` campagnes ; `photo` témoignages ; `file_url` études/presse |

### 5.9 Live thumbnails (priorité P2 — coordination Live)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| L1 | Upload thumbnail par `live_event.id` | PATCH live ou media picker |
| L2 | `thumbnail_alt` | Accessibilité |
| L3 | Default si absent | Lien vers D2 |

### 5.10 Partenaires — logos (priorité P2)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| R1 | Upload logo fichier (pas URL manuelle) | Extension `POST /api/admin/partners` multipart ou picker |
| R2 | Grille preview logos | Sous-onglet Design ou lien vers section Partenaires |

### 5.11 Identité & PWA (priorité P3)

| ID | Fonctionnalité | Détail |
|----|----------------|--------|
| I1 | Remplacer `public/icon.svg` | Upload SVG/PNG 512×512 |
| I2 | Preview manifest | Lecture `manifest.json` |
| I3 | Image Open Graph default | `site_settings.og_image` + meta layout |
| I4 | Couleurs theme | Lecture seule depuis `tailwind.config.ts` (documenter) |

### 5.12 Pipeline & qualité (priorité P2)

Aligné `WEBDESIGN.md` §9.2 :

| Étape | Implémentation future |
|-------|----------------------|
| Validation MIME | Déjà partiel (élargir PDF) |
| Compression Sharp | Resize + WebP à l'upload |
| Limite taille par type | Image 5 Mo, vidéo 15 Mo, PDF 10 Mo |
| Génération variants | thumb 400px, hero 1920px |
| Audit log | Déjà `logAdminAction` sur media — étendre métadonnées |

---

## 6. Évolution API proposée

### 6.1 Endpoints nouveaux / étendus

| Endpoint | Méthodes | Rôle |
|----------|----------|------|
| `/api/admin/media` | GET étendu | Retourne site_settings + collections (galerie, axes, defaults) |
| `/api/admin/media/library` | GET, DELETE | Bibliothèque fichiers |
| `/api/admin/media/upload` | POST | Upload générique + Sharp + category |
| `/api/admin/media/assign` | PATCH | Assigner path à une clé ou entité |
| `/api/admin/media/gallery` | GET, PUT | CRUD galerie FIKIN ordonnée |
| `/api/admin/media/axes` | GET, PUT | CRUD images axes |
| `/api/admin/media/defaults` | GET, PUT | Defaults globaux |
| `/api/admin/media/press-kit` | POST | PDF dossier presse |
| `/api/admin/media/usage/[path]` | GET | Où est utilisé ce fichier |

### 6.2 Schéma `site_settings` étendu (clés JSON)

```json
{
  "hero_image": "/media/uploads/...",
  "hero_image_mobile": "/media/hero/hero-home-mobile.webp",
  "hero_poster": "...",
  "hero_video": "...",
  "hero_image_alt": "Familles militaires rassemblées à Kinshasa",
  "mission_image": "...",
  "mission_image_alt": "...",
  "fikin_gallery": "[{\"src\":\"...\",\"alt\":\"...\",\"sort\":1}]",
  "axis_images": "{\"social\":\"/media/axes/social.webp\",...}",
  "about_founder": "/media/equipe/fondateur.webp",
  "about_team": "/media/equipe/benevoles.webp",
  "default_news_cover": "/media/actualites/default.webp",
  "default_live_thumb": "/media/live/fikin-live-thumb.webp",
  "default_testimonial_anonymous": "...",
  "press_kit_url": "/media/presse/dossier-presse.pdf",
  "og_image": "/media/og/og-default.webp",
  "media_catalog": "[{ \"path\", \"alt\", \"tags\", \"uploaded_at\" }]"
}
```

**Alternative V2 production** : table PostgreSQL `media_assets` + `media_usages` (meilleur pour VPS, audit, CDN).

### 6.3 Refactor `media.ts` / `media.server.ts`

| Fonction | Comportement cible |
|----------|-------------------|
| `getSiteMedia()` | Lire `site_settings` + fallbacks `MEDIA` |
| `getResolvedGallery()` | Lire `site_settings.fikin_gallery` || `MEDIA.fikinGallery` |
| `getAxisImage()` | Lire `site_settings.axis_images[slug]` || `MEDIA.axes` |
| `getResolvedAboutMedia()` | Lire settings équipe || `MEDIA.about` |
| `getResolvedNewsCover()` | inchangé (entité + default settings) |
| `getResolvedLiveThumb()` | inchangé (entité + default settings) |

**Principe** : `MEDIA` devient **fallback seed** uniquement, pas source éditoriale.

---

## 7. Maquettes fonctionnelles (wireframes textuels)

### 7.1 Vue Accueil & hero (remplit le main)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Médias & design                                    [Actualiser] [Aide]    │
├──────────────────────────────────────────────────────────────────────────┤
│ [Accueil & hero] [Bibliothèque] [Collections ▾] [Presse] [Sans visuel]   │
├───────────────────────────────┬──────────────────────────────────────────┤
│ Hero desktop    [aperçu]      │  PREVIEW ACCUEIL                          │
│ [Upload] [Reset]              │  ┌────────────────────────────────────┐  │
│ Alt: [________________]       │  │ HeroMedia simulé                   │  │
│                               │  │ (vidéo ou image + overlay)         │  │
│ Hero mobile     [aperçu]      │  └────────────────────────────────────┘  │
│ [Upload]                      │  Utilisé sur : / (accueil)               │
│                               │                                          │
│ Vidéo hero      [player]      │                                          │
│ Poster          [aperçu]      │                                          │
│                               │                                          │
│ Image mission   [aperçu]      │                                          │
│ Alt: [________________]       │                                          │
└───────────────────────────────┴──────────────────────────────────────────┘
```

### 7.2 Bibliothèque

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 🔍 Rechercher...   Type [Tous ▾]   Catégorie [Tous ▾]   [+ Upload]       │
├──────────────────────────────────────────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                               │
│ │thumb│ │thumb│ │thumb│ │ PDF │ │thumb│ ...                           │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                               │
│  hero   fikin  axes  presse  live                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Plan d'exécution par phases

### Phase 0 — Préparation (2–3 jours)

| # | Tâche | Livrable | Critère |
|---|-------|----------|---------|
| 0.1 | Valider ce plan avec le fondateur | Sign-off | Périmètre figé |
| 0.2 | Inventaire photos réelles disponibles (`assets/incoming/`) | Liste assets | ≥ 8 photos exploitables |
| 0.3 | Définir politique Netlify (non persistant) vs VPS | Note dans plan déploiement | Workflow upload documenté |
| 0.4 | Rédiger matrice alt text FR pour assets existants | CSV | 100 % assets seed |

### Phase 1 — Fondation hub Design (1 semaine)

| # | Tâche | Fichiers cibles | Critère |
|---|-------|-----------------|---------|
| 1.1 | Extraire `AdminDesignPanel` → layout tabs pleine largeur | `components/admin/design/*` | Main utilise 100 % largeur |
| 1.2 | Sous-composants : `HeroSection`, `MediaPreviewPane`, `DesignTabs` | architecture admin | < 250 lignes/fichier |
| 1.3 | Brancher toasts (`useAdminToast`) partout | remplace `message` local | Feedback uniforme |
| 1.4 | Étendre GET `/api/admin/media` (mobile + alt) | API + `site_settings` | 6 champs hero |
| 1.5 | Preview composite hero | `DesignHeroPreview.tsx` | Aperçu fidèle `HeroMedia` |
| 1.6 | Bouton reset placeholder | API PATCH | Restauration en 1 clic |

### Phase 2 — Bibliothèque & upload générique (1 semaine)

| # | Tâche | Critère |
|---|-------|---------|
| 2.1 | Endpoint `library` + scan `uploads/` | Liste tous uploads |
| 2.2 | Upload drag-and-drop multi-fichiers | ≥ 5 images d'affilée |
| 2.3 | Intégration Sharp (resize + WebP) | Poids < cibles WEBDESIGN |
| 2.4 | Métadonnées alt + tags | Éditable par asset |
| 2.5 | DELETE avec garde-fou usages | Impossible si référencé |

### Phase 3 — Collections statiques (1 semaine)

| # | Tâche | Critère |
|---|-------|---------|
| 3.1 | CRUD galerie FIKIN (ordre, alt) | `/a-propos` reflète admin |
| 3.2 | CRUD 5 images axes | `/axes` + accueil OK |
| 3.3 | CRUD équipe fondateur/bénévoles | `/a-propos` OK |
| 3.4 | CRUD defaults (actu, live, témoignage) | Fallbacks dynamiques |
| 3.5 | Refactor `media.ts` / `media.server.ts` | Settings prioritaire sur MEDIA |

### Phase 4 — Pont contenu & live (1 semaine)

| # | Tâche | Critère |
|---|-------|---------|
| 4.1 | Composant `MediaPicker` partagé | Réutilisable admin |
| 4.2 | Intégrer picker dans `ContentPanel` (cover, image, photo, PDF) | Upload cover actualité |
| 4.3 | Intégrer picker dans `AdminV3Panel` (thumbnail) | Thumb live visible sur `/live` |
| 4.4 | Onglet « Sans visuel » dans Design | Liste + CTA assigner |
| 4.5 | Étendre `adminCreate` / `adminUpdateContent` pour champs média | Données persistées |

### Phase 5 — Presse, partenaires, identité (3–4 jours)

| # | Tâche | Critère |
|---|-------|---------|
| 5.1 | Upload dossier presse PDF | `/presse` télécharge le bon fichier |
| 5.2 | Upload logo partenaire (fichier) | Plus d'URL manuelle |
| 5.3 | Upload favicon / OG image | Meta partage social |
| 5.4 | Preview manifest PWA | Lecture seule |

### Phase 6 — Qualité, tests, doc (3–4 jours)

| # | Tâche | Critère |
|---|-------|---------|
| 6.1 | Tests API media (`__tests__/api/admin-media`) | Upload, assign, delete |
| 6.2 | Tests composants Design (smoke RTL) | Tabs, upload mock |
| 6.3 | `docs/admin-design-medias-runbook.md` | Fondateur autonome |
| 6.4 | Audit Lighthouse accueil post-médias | LCP < 2,5 s |
| 6.5 | Vérification WCAG alt | 100 % images ont alt |

**Durée totale estimée** : **4–5 semaines** (1 dev), alignée Phase F d'`AdminRecovery.md`.

---

## 9. Matrice de couverture cible (récap)

| Asset / fonction | Phase | Page(s) | Admin UI |
|------------------|-------|---------|----------|
| Hero desktop | 1 | `/` | Accueil & hero |
| Hero mobile | 1 | `/` | Accueil & hero |
| Hero vidéo + poster | 1 | `/` | Accueil & hero |
| Image mission | 1 | `/` | Accueil & hero |
| Bibliothèque uploads | 2 | Toutes | Bibliothèque |
| Galerie FIKIN | 3 | `/`, `/a-propos` | Collections |
| Images axes ×5 | 3 | `/`, `/axes` | Collections |
| Équipe | 3 | `/a-propos` | Collections |
| Defaults actu/live/témoignage | 3 | multiples | Collections |
| Cover actualité | 4 | `/plaidoyer`, `/actualites/*` | MediaPicker + Contenu |
| Image campagne | 4 | `/plaidoyer` | MediaPicker + Contenu |
| PDF étude / presse | 4–5 | `/plaidoyer`, `/presse` | MediaPicker + Presse |
| Photo témoignage | 4 | `/` | MediaPicker + Contenu |
| Thumbnail live | 4 | `/live` | MediaPicker + Live |
| Logo partenaire | 5 | footer/presse | Partenaires + Design |
| Dossier presse PDF | 5 | `/presse` | Presse & documents |
| Favicon / OG | 5 | global | Identité & PWA |

---

## 10. Contraintes déploiement

### 10.1 Netlify (démo actuelle)

| Contrainte | Impact Design & médias | Mitigation |
|------------|------------------------|------------|
| Disque éphémère | Uploads perdus au redeploy | Afficher bandeau « démo » ; sync vers commit Git optionnel |
| Pas de Sharp natif garanti | Compression serveur | Utiliser `@netlify/plugin-nextjs` + wasm sharp ou pre-process client |
| `public/media/uploads/` non versionné | Images admin locales seulement | Documenter ; prod réelle = VPS |

### 10.2 VPS + PostgreSQL (production cible)

- Table `media_assets` recommandée
- Stockage objet (S3/R2) à moyen terme
- CDN Cloudflare pour `public/media/`

---

## 11. Risques & décisions ouvertes

| # | Risque / décision | Options | Recommandation |
|---|-------------------|---------|----------------|
| R1 | Où stocker la galerie FIKIN ? | `site_settings` JSON vs table dédiée | JSON Phase 1–2 ; table PG Phase VPS |
| R2 | Fusionner Partenaires dans Design ? | Oui / Non | **Non** — lien preview seulement |
| R3 | `social_links` dans Design ou i18n ? | Design / i18n | **i18n** (déjà implémenté) |
| R4 | Compression côté serveur vs client | Sharp serveur | Sharp serveur (VPS) ; client-side resize sur Netlify |
| R5 | Suppression fichiers orphelins | Cron / manuel | Bouton « Nettoyer uploads orphelins » Phase 2 |
| R6 | Floutage auto témoignages anonymes | Sharp blur / CSS | CSS `blur-sm` Phase 4 ; Sharp optionnel |

---

## 12. Critères d'acceptation finaux (Definition of Done)

Le `<main>` **Design & médias** est considéré **100 % fonctionnel** quand :

1. **Aucun visuel du site** ne dépend uniquement d'un hardcode `MEDIA.*` sans override admin possible.
2. Le fondateur peut **remplacer le hero complet** (desktop, mobile, vidéo, mission) sans toucher au code.
3. La **galerie FIKIN** et les **5 axes** sont administrables avec réordonnancement.
4. Les **defaults** (actu, live, témoignage) sont administrables.
5. La **bibliothèque** liste tous les uploads avec alt, preview, et usages.
6. Un **MediaPicker** permet d'assigner un visuel aux actualités, campagnes, témoignages, lives.
7. Le **dossier presse PDF** est remplaçable depuis l'admin.
8. Les **logos partenaires** s'uploadent en fichier.
9. Chaque mutation affiche un **toast** et est tracée dans le **journal d'audit**.
10. La documentation runbook permet l'autonomie complète.

---

## 13. Prochaine étape

**Validation de ce plan** → démarrer **Phase 1** (refactor UI tabs + extension hero mobile/alt) sans attendre la bibliothèque complète.

Fichiers principaux impactés (référence future, pas de modification maintenant) :

```
src/components/admin/design/          ← nouveau module
src/components/admin/AdminDesignPanel.tsx
src/components/admin/ui/media-picker.tsx
src/app/api/admin/media/
src/lib/media.ts
src/lib/media.server.ts
src/infrastructure/repositories/content.repository.ts
docs/admin-design-medias-runbook.md
```

---

*CFM ASBL — DesignMedias Plan v1.0 — juillet 2026*
