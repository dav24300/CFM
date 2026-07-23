# Plan de conception web — CFM ASBL

> ⚠️ **OBSOLÈTE (design system)** — Ce document de *planification* décrit l'ancienne palette
> (`cfm-navy/gold/cream` + Playfair/Nunito) remplacée par la refonte. Pour le design system
> réel (familles `site`/`admin`, tokens, thème sombre admin), voir **[`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md)**
> et l'aperçu vivant `/admin/style-guide`. Le reste ci-dessous est conservé pour l'historique.

> **Cri de Familles Militaires** — Refonte visuelle épurée, riche en médias et animations modernes  
> Document de référence design — **aucune implémentation code** (planification uniquement)  
> *Mise à jour : juillet 2026*

---

## Table des matières

1. [Contexte & objectifs](#1-contexte--objectifs)
2. [Diagnostic du design actuel](#2-diagnostic-du-design-actuel)
3. [Direction créative](#3-direction-créative)
4. [Design system](#4-design-system)
5. [Architecture des médias](#5-architecture-des-médias)
6. [Animations & micro-interactions](#6-animations--micro-interactions)
7. [Composants réutilisables](#7-composants-réutilisables)
8. [Plan page par page](#8-plan-page-par-page)
9. [Espace admin & gestion média](#9-espace-admin--gestion-média)
10. [Performance & accessibilité](#10-performance--accessibilité)
11. [Phases d'implémentation](#11-phases-dimplémentation)
12. [Livrables & critères de validation](#12-livrables--critères-de-validation)
13. [Annexes](#13-annexes)

---

## 1. Contexte & objectifs

### 1.1 Identité du projet

| Élément | Détail |
|---------|--------|
| **Nom** | Cri de Familles Militaires |
| **Sigle** | CFM |
| **Statut** | ASBL — République Démocratique du Congo |
| **Fondation** | 2018 — Ngonga Mbana Glody |
| **Moment fondateur** | Rassemblement FIKIN 2025 |
| **Ambiance cible** | Chaleureuse, familiale, institutionnelle sans froideur |
| **Domaine** | cfmasbl.com |

### 1.2 Message central

> *« Le vrai visage de la guerre sous toutes ses formes se retrouve dans le quotidien des personnes que vous avez décidé d'approcher. »*

### 1.3 Objectifs de la refonte design

| Objectif | Description |
|----------|-------------|
| **Épuré** | Moins de densité visuelle, plus d'espace, hiérarchie claire |
| **Humain** | Photos et vidéos de familles, FIKIN, terrain RDC |
| **Moderne** | Animations subtiles au scroll, micro-interactions soignées |
| **Crédible** | Ton institutionnel adapté aux décideurs et aux médias |
| **Performant** | Compatible connexions 3G (public prioritaire Kinshasa / RDC) |
| **Multilingue** | Design compatible FR, EN, Lingala, Swahili |

### 1.4 Publics visés

- Familles militaires (veuves, orphelins, conjoints)
- Décideurs et institutions
- Médias et partenaires
- Bénévoles et donateurs
- Grand public sensible à la cause

---

## 2. Diagnostic du design actuel

### 2.1 Stack & fondations existantes

| Couche | État actuel |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Styles | Tailwind CSS 3.4 |
| Typographie | Nunito (sans) + Playfair Display (display) via `next/font` |
| Icônes | Lucide React |
| Animations | Quasi inexistantes (`animate-pulse` sur badge live uniquement) |
| Images | Aucune — dossier `public/` limité à `icon.svg`, `manifest.json`, `sw.js` |
| Vidéo | Player YouTube / stream natif sur `/live` uniquement |

### 2.2 Palette actuelle (à conserver)

```
cfm-navy   #1a2f4a   — fonds hero, footer, textes forts
cfm-gold   #c9a227   — accents, CTA, surlignages
cfm-warm   #d4845c   — touches humaines
cfm-cream  #faf7f2   — fond principal
cfm-earth  #5c4a3a   — corps de texte
```

### 2.3 Points forts

- Identité couleur cohérente et mémorable (navy + or)
- Typographie bien choisie : sérieux (Playfair) + accessibilité (Nunito)
- Classes utilitaires réutilisables : `.btn-primary`, `.section-title`, `.card`
- Structure responsive mobile-first
- Header sticky avec backdrop-blur
- Live, PWA, i18n déjà fonctionnels (V3)

### 2.4 Limites visuelles identifiées

| Problème | Fichier / zone | Impact |
|----------|----------------|--------|
| Hero sans visuel | `src/app/(site)/page.tsx` | Pas d'accroche émotionnelle |
| Aucune image sur le site | `public/` | Site 100 % texte + icônes |
| Sections homogènes | Toutes les pages | Fatigue visuelle, pas de hiérarchie |
| 9 blocs sur l'accueil | Page d'accueil | Trop dense, manque de respiration |
| Témoignages sans portraits | Section témoignages | Crédibilité réduite |
| Actualités sans vignettes | Section actualités | Cartes peu engageantes |
| Axes sans photo thématique | `src/app/(site)/axes/page.tsx` | 5 sections identiques visuellement |
| Carte actions simplifiée | `src/app/(site)/actions/page.tsx` | Liste provinces au lieu d'une carte visuelle |
| Live sans thumbnails | `src/app/(site)/live/page.tsx` | Grille texte sans repère visuel |
| Pas de `next/image` | Global | Pas d'optimisation images |
| Pas de bibliothèque d'animation | `package.json` | Expérience statique |

### 2.5 Synthèse diagnostic

Le site est **fonctionnel, crédible et bien structuré techniquement**, mais ressemble à un **prototype contenu** plutôt qu'à une vitrine émotionnelle pour une cause humaine. La refonte design est principalement un travail de **contenu visuel**, **composants média** et **animations**, pas une réécriture technique complète.

---

## 3. Direction créative

### 3.1 Concept directeur

> **« Derrière chaque uniforme, un visage de famille. »**

Un design **minimaliste et éditorial** où chaque image ou vidéo a une intention narrative. L'espace blanc (crème) respire. Les animations accompagnent le contenu sans le distraire. La narration visuelle s'articule autour de trois piliers :

1. **FIKIN 2025** — moment fondateur, preuve de mobilisation
2. **Les familles** — visages, témoignages, humanisation de la cause
3. **Le terrain RDC** — 26 provinces, actions concrètes, ancrage local

### 3.2 Principes directeurs

| # | Principe | Application |
|---|----------|-------------|
| 1 | **Moins de sections, plus d'impact** | 5–6 blocs forts sur l'accueil (au lieu de 9) |
| 2 | **1 hero = 1 émotion** | Vidéo ou photo plein écran, texte court, 2 CTA max |
| 3 | **Médias avec intention** | Chaque visuel raconte une histoire (pas de stock générique) |
| 4 | **Animations au service du contenu** | Reveal au scroll, jamais de parallax excessif |
| 5 | **Performance d'abord** | Lazy load, WebP, vidéos courtes, respect 3G |
| 6 | **Accessibilité native** | Contrastes WCAG AA, `prefers-reduced-motion`, alt text |
| 7 | **Cohérence multilingue** | Layouts flexibles pour textes LN/SW plus longs |

### 3.3 Ton visuel

| À viser | À éviter |
|---------|----------|
| Lumière dorée, chaleur familiale | Esthétique militaire « camouflage » |
| Sobriété navy, crédibilité institutionnelle | ONG trop corporate / froide |
| Portraits authentiques, floutage si anonymat | Stock photos génériques occidentaux |
| Couleurs terre, ancrage africain | Surcharge de couleurs vives |
| Animations subtiles, élégantes | Effets gadget, parallax agressif |

### 3.4 Références inspirantes (moodboard)

| Référence | Ce qu'on retient |
|-----------|------------------|
| **UNICEF Stories** | Storytelling photo-first, mise en page épurée |
| **Charity: Water** | Hero vidéo, typographie large, CTA clairs |
| **Amnesty International** | Cause forte, contrastes nets, crédibilité |
| **Global Citizen** | Live events, intégration vidéo moderne |

---

## 4. Design system

### 4.1 Palette enrichie

Conserver la palette existante et ajouter des tokens dérivés :

```css
/* Couleurs existantes — ne pas modifier */
--cfm-navy:   #1a2f4a;
--cfm-gold:   #c9a227;
--cfm-warm:   #d4845c;
--cfm-cream:  #faf7f2;
--cfm-earth:  #5c4a3a;

/* Nouveaux tokens */
--cfm-navy-80:    rgba(26, 47, 74, 0.8);   /* overlay hero */
--cfm-navy-60:    rgba(26, 47, 74, 0.6);   /* overlay léger */
--cfm-gold-20:    rgba(201, 162, 39, 0.2); /* fond accent subtil */
--cfm-white-glass: rgba(255, 255, 255, 0.8); /* cartes glass */
--cfm-shadow:     0 4px 24px rgba(26, 47, 74, 0.08);
--cfm-shadow-lg:  0 8px 40px rgba(26, 47, 74, 0.12);
```

### 4.2 Typographie

| Élément | Police | Taille desktop | Taille mobile | Poids |
|---------|--------|----------------|---------------|-------|
| Hero H1 | Playfair Display | 4.5–5rem (72–80px) | 2.5–3rem (40–48px) | 700 |
| Section H2 | Playfair Display | 2.25–2.5rem | 1.875rem | 700 |
| Sous-section H3 | Playfair Display | 1.5–1.75rem | 1.25rem | 700 |
| Corps | Nunito | 1rem (16px) | 1rem | 400 |
| Corps large | Nunito | 1.125–1.25rem | 1.125rem | 400 |
| Label / badge | Nunito | 0.75rem | 0.75rem | 600, uppercase |
| Citation | Playfair Display | 1.25–1.5rem | 1.125rem | 400 italic |

**Règles typographiques :**
- Titres : `leading-[1.1]`, `tracking-tight`, `text-wrap: balance`
- Corps : `leading-relaxed` (1.625), paragraphes max 3–4 lignes
- Sous-titres : max 2 lignes, couleur `gray-300` sur fond navy

### 4.3 Espacements & grille

| Token | Valeur | Usage |
|-------|--------|-------|
| Section padding | `py-24 md:py-32` | Entre sections (remplace `py-16`) |
| Conteneur large | `max-w-6xl` (1152px) | Grilles, listes |
| Conteneur texte | `max-w-4xl` (896px) | Articles, formulaires |
| Conteneur étroit | `max-w-2xl` (672px) | Citations, newsletter |
| Gap grilles | `gap-8 md:gap-12` | Cartes, colonnes |
| Padding horizontal | `px-4 md:px-6` | Marges latérales |

### 4.4 Composants UI existants (à conserver & enrichir)

| Classe actuelle | Évolution prévue |
|-----------------|-------------------|
| `.btn-primary` | Ajouter hover scale 1.02, transition shadow |
| `.btn-secondary` | Idem + variante ghost |
| `.btn-outline-light` | Conserver pour hero navy |
| `.section-title` | Ajouter variante `.section-title-light` (texte blanc) |
| `.section-subtitle` | Limiter à 2 lignes (`line-clamp-2`) |
| `.card` | Variantes : `.card-media`, `.card-glass`, `.card-flat` |
| `.input-field` | Conserver, ajouter état error/success |

### 4.5 Nouvelles classes utilitaires à créer

```css
.hero-overlay        /* gradient navy 60% → transparent */
.media-frame         /* rounded-2xl overflow-hidden shadow-xl */
.text-balance        /* text-wrap: balance */
.glass-card          /* bg-white/80 backdrop-blur-md */
.fade-in-view        /* opacity 0 → 1 + translateY au scroll */
.section-divider     /* ligne or 1px ou vague SVG subtile */
.live-badge          /* pulse rouge + glow pour statut EN DIRECT */
.image-zoom-hover    /* scale 1.05 au hover sur media cards */
```

### 4.6 Rayons & ombres

| Élément | Border-radius | Ombre |
|---------|---------------|-------|
| Boutons | `rounded-lg` (8px) | Aucune |
| Cartes | `rounded-xl` (12px) | `shadow-md` → hover `shadow-lg` |
| Images / médias | `rounded-2xl` (16px) | `shadow-xl` |
| Avatars | `rounded-full` | Aucune |
| Badges | `rounded-full` | Aucune |
| Player vidéo | `rounded-xl` | Aucine (plein cadre) |

### 4.7 Iconographie

- Conserver **Lucide React** pour l'UI fonctionnelle (nav, formulaires, badges)
- Remplacer les icônes seules sur les axes par **photos + petit badge icône** en overlay
- Créer ou sourcer une **illustration SVG carte RDC** pour la page Actions

---

## 5. Architecture des médias

### 5.1 Inventaire des contenus visuels à produire

| Type | Quantité | Usage | Priorité |
|------|----------|-------|----------|
| Photo hero accueil | 1 (+ 1 poster vidéo) | Plein écran, accroche émotionnelle | Haute |
| Vidéo hero accueil | 1 (15–30 s) | Loop muet, FIKIN ou familles | Haute |
| Galerie FIKIN 2025 | 8–12 photos | Accueil, À propos, presse | Haute |
| Portraits témoignages | 4–6 (floutés si anonyme) | Carousel témoignages | Haute |
| Photos par axe (×5) | 5 | Page Axes, cartes accueil | Moyenne |
| Vignettes actualités | 1 par article | Plaidoyer, accueil | Moyenne |
| Thumbnails live | 1 par événement | Page `/live` | Moyenne |
| Photo fondateur | 1 | Page À propos | Moyenne |
| Photo équipe / bénévoles | 2–3 | À propos, S'engager | Basse |
| Logos partenaires | Variable | Footer, presse | Basse |
| Illustration carte RDC | 1 SVG | Page Actions | Moyenne |
| Icône PWA améliorée | 1 | Manifest, favicon | Basse |

### 5.2 Charte de production photo/vidéo

| Critère | Règle |
|---------|-------|
| **Consentement** | Autorisation écrite pour chaque personne identifiable |
| **Anonymat** | Floutage visage si témoignage anonyme |
| **Authenticité** | Photos réelles CFM uniquement — pas de banque d'images |
| **Diversité** | Veuves, enfants, conjoints, différentes provinces |
| **Lumière** | Privilégier lumière naturelle, tons chauds |
| **Cadrage** | Portraits serrés + plans larges événementiels |
| **Vidéo hero** | 15–30 s, muet, loop, format 16:9, < 3 Mo |

### 5.3 Formats & compression

| Type | Format source | Format web | Dimensions max | Poids cible |
|------|---------------|------------|----------------|-------------|
| Hero desktop | RAW / JPG | WebP | 1920 × 1080 | < 150 Ko |
| Hero mobile | — | WebP | 768 × 1024 | < 80 Ko |
| Vignette article | JPG | WebP | 800 × 450 | < 40 Ko |
| Portrait | JPG | WebP | 400 × 400 | < 25 Ko |
| Galerie | JPG | WebP | 1200 × 800 | < 100 Ko |
| Thumbnail live | JPG / capture | WebP | 640 × 360 | < 30 Ko |
| Vidéo hero | MP4 (H.264) | MP4 | 1920 × 1080 | < 3 Mo |
| Logo partenaire | SVG / PNG | SVG ou WebP | hauteur 48px | < 10 Ko |

**Pipeline de compression recommandé :**
1. Export depuis appareil photo / retouche légère
2. Redimensionnement (Sharp ou Squoosh CLI)
3. Conversion WebP qualité 80–85
4. Vérification poids + qualité visuelle
5. Placement dans `public/media/`

### 5.4 Structure des dossiers

```
public/
├── icon.svg                    (existant)
├── manifest.json               (existant)
├── sw.js                       (existant)
└── media/
    ├── hero/
    │   ├── hero-home.webp          # Photo hero desktop
    │   ├── hero-home-mobile.webp   # Photo hero mobile
    │   ├── hero-home-poster.webp   # Poster vidéo
    │   └── hero-fikin.mp4          # Vidéo loop hero
    ├── fikin-2025/
    │   ├── rassemblement-01.webp
    │   ├── rassemblement-02.webp
    │   └── ... (8–12 photos)
    ├── axes/
    │   ├── social.webp
    │   ├── economie.webp
    │   ├── education.webp
    │   ├── environnement.webp
    │   └── sante.webp
    ├── temoignages/
    │   ├── portrait-01.webp
    │   └── ... (4–6 portraits)
    ├── equipe/
    │   ├── fondateur.webp
    │   └── benevoles.webp
    ├── live/
    │   ├── fikin-live-thumb.webp
    │   └── ... (thumbnails événements)
    ├── actualites/
    │   └── ... (vignettes par article)
    ├── partenaires/
    │   └── ... (logos SVG/PNG)
    └── illustrations/
        └── carte-rdc.svg
```

### 5.5 Extension du modèle de données

Champs média à ajouter aux entités existantes dans `data/store.json` :

```json
{
  "news": {
    "coverImage": "/media/actualites/slug.webp",
    "coverImageAlt": "Description accessible",
    "videoUrl": null
  },
  "testimonials": {
    "photo": "/media/temoignages/portrait-01.webp",
    "photoAlt": "Mère de famille, Kinshasa",
    "videoQuoteUrl": null
  },
  "campaigns": {
    "heroImage": "/media/campaigns/slug-hero.webp",
    "gallery": ["/media/campaigns/slug-01.webp"]
  },
  "live_events": {
    "thumbnail": "/media/live/slug-thumb.webp",
    "previewClip": "/media/live/slug-preview.mp4"
  },
  "actions": {
    "photo": "/media/actions/province-event.webp"
  },
  "site_settings": {
    "heroImage": "/media/hero/hero-home.webp",
    "heroVideo": "/media/hero/hero-fikin.mp4",
    "heroPoster": "/media/hero/hero-home-poster.webp"
  }
}
```

### 5.6 Règles d'utilisation `next/image`

| Contexte | Props recommandées |
|----------|-------------------|
| Hero above-the-fold | `priority`, `fill`, `sizes="100vw"` |
| Vignettes grilles | `width={800}`, `height={450}`, `sizes="(max-width:768px) 100vw, 33vw"` |
| Portraits | `width={400}`, `height={400}`, `className="rounded-full object-cover"` |
| Galerie | `width={1200}`, `height={800}`, lazy load par défaut |
| Logos | `height={48}`, `width={auto}` |

---

## 6. Animations & micro-interactions

### 6.1 Stack animation recommandée

| Outil | Rôle | Justification |
|-------|------|---------------|
| **Framer Motion** | Animations React (scroll reveal, page transitions, layout) | Intégration native Next.js + React 19, API déclarative |
| **CSS `@keyframes`** | Hover boutons, pulse live, loaders | Zéro dépendance, performance GPU |
| **CSS scroll-snap** | Carousel témoignages | Natif, fluide mobile, pas de JS |
| **Intersection Observer** | Déclenchement reveals (via Framer ou hook custom) | Standard, léger |

> **Ne pas utiliser GSAP** pour ce projet : Framer Motion suffit et s'intègre mieux à l'écosystème React.

### 6.2 Catalogue d'animations par priorité

#### Niveau 1 — Essentiel (impact fort, effort faible)

| Animation | Élément | Paramètres | Déclencheur |
|-----------|---------|------------|-------------|
| **Fade-in cascade** | Texte hero (titre, sous-titre, CTA) | `staggerChildren: 0.1`, `duration: 0.6` | Mount |
| **Fade-up reveal** | Cartes axes, actualités, campagnes | `opacity: 0→1`, `y: 20→0`, `duration: 0.5` | Scroll (viewport 20%) |
| **Scale hover** | Boutons `.btn-primary`, `.btn-secondary` | `scale: 1.02`, `duration: 0.2` | Hover |
| **Shadow hover** | Cartes `.card`, `.card-media` | `shadow-md → shadow-lg`, `duration: 0.3` | Hover |
| **Header shrink** | Header sticky | Hauteur 72px → 56px, logo réduit | Scroll > 100px |
| **Live pulse** | Badge « EN DIRECT » | Pulse rouge + `box-shadow` glow | Permanent si live actif |

#### Niveau 2 — Immersion

| Animation | Élément | Paramètres | Déclencheur |
|-----------|---------|------------|-------------|
| **Vidéo fondu** | Hero vidéo | Poster → vidéo, `opacity: 0→1`, `duration: 1` | Mount + loaded |
| **Compteur animé** | Chiffres mission (2018, 26, FIKIN) | Count up 0→valeur, `duration: 2` | Scroll into view |
| **Slide alterné** | Sections page Axes | Image `x: -40→0` / `x: 40→0` alterné | Scroll |
| **Carousel snap** | Témoignages | CSS `scroll-snap-type: x mandatory` | Scroll / swipe |
| **Image zoom hover** | Media cards | `scale: 1→1.05` sur image interne | Hover |
| **Layout shift** | Filtre Actions (province) | Framer `layout` animation sur cartes | Changement filtre |

#### Niveau 3 — Signature CFM

| Animation | Élément | Paramètres | Déclencheur |
|-----------|---------|------------|-------------|
| **Parallax léger** | Hero background image | `y: 0→-50px` sur scroll | Scroll (desktop only) |
| **Page transition** | Changement de route | Fade `opacity: 0→1`, `duration: 0.2` | Navigation |
| **Carte RDC interactive** | Provinces SVG | Fill color transition + scale pin | Hover / click province |
| **Timeline reveal** | Page À propos | Ligne verticale + points animés | Scroll séquentiel |
| **Onde sonore live** | Barre statut live | 3 barres CSS oscillantes | Live actif |
| **Lightbox galerie** | Photos FIKIN | Scale + fade overlay | Click image |

### 6.3 Durées & easing standards

| Type | Durée | Easing |
|------|-------|--------|
| Micro-interaction (hover) | 150–200 ms | `ease-out` |
| Reveal scroll | 400–600 ms | `[0.25, 0.1, 0.25, 1]` (ease standard) |
| Page transition | 200 ms | `ease-in-out` |
| Compteur | 1500–2000 ms | `ease-out` |
| Hero cascade | 600 ms total | `stagger 100 ms` |

### 6.4 Accessibilité animations

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Règles obligatoires :**
- Toute animation décorative désactivée si `prefers-reduced-motion: reduce`
- Vidéo hero remplacée par image statique (poster) si reduced motion
- Parallax désactivé sur mobile ET si reduced motion
- Les animations ne doivent jamais bloquer l'accès au contenu
- Pas de contenu qui clignote plus de 3 fois par seconde

---

## 7. Composants réutilisables

### 7.1 Liste des composants à créer

| Composant | Fichier prévu | Description | Props clés |
|-----------|---------------|-------------|------------|
| `<HeroMedia>` | `components/ui/HeroMedia.tsx` | Hero plein écran image ou vidéo + overlay + slot contenu | `image`, `video`, `poster`, `overlay`, `children` |
| `<ScrollReveal>` | `components/ui/ScrollReveal.tsx` | Wrapper Framer Motion fade-in au scroll | `delay`, `direction`, `children` |
| `<MediaCard>` | `components/ui/MediaCard.tsx` | Carte avec image 16:9 + titre + extrait + lien | `image`, `title`, `excerpt`, `href`, `badge` |
| `<TestimonialCarousel>` | `components/ui/TestimonialCarousel.tsx` | Carousel snap horizontal avec portraits | `items[]` (content, author, photo, role) |
| `<StatCounter>` | `components/ui/StatCounter.tsx` | Chiffre animé count-up | `value`, `label`, `suffix` |
| `<VideoBackground>` | `components/ui/VideoBackground.tsx` | Vidéo loop muet avec poster fallback | `src`, `poster`, `className` |
| `<ImageGallery>` | `components/ui/ImageGallery.tsx` | Grille masonry + lightbox | `images[]` (src, alt, caption) |
| `<SectionDivider>` | `components/ui/SectionDivider.tsx` | Séparateur visuel entre sections | `variant`: line, wave, gold |
| `<LiveBadge>` | `components/ui/LiveBadge.tsx` | Badge pulse « EN DIRECT » | `active`: boolean |
| `<PageHero>` | `components/ui/PageHero.tsx` | Sous-hero uniforme pages intérieures | `title`, `subtitle`, `image`, `breadcrumbs` |
| `<RDCCMap>` | `components/ui/RDCCMap.tsx` | Carte SVG interactive 26 provinces | `provinces[]`, `onSelect`, `selected` |
| `<TimelineVertical>` | `components/ui/TimelineVertical.tsx` | Timeline animée verticale | `events[]` (date, title, description, image) |
| `<Lightbox>` | `components/ui/Lightbox.tsx` | Visionneuse plein écran | `images[]`, `initialIndex`, `onClose` |

### 7.2 Composants existants à modifier

| Composant | Modification |
|-----------|-------------|
| `Header.tsx` | Ajouter shrink au scroll, transition logo |
| `Footer.tsx` | Ajouter logos partenaires, photo miniature |
| `LivePlayer.tsx` | Encadrer dans `media-frame`, ajouter thumbnail fallback |
| `NewsletterForm.tsx` | Intégrer dans design `glass-card` |
| Pages `(site)/page.tsx` | Refonte complète avec nouveaux composants |

---

## 8. Plan page par page

### 8.1 Accueil (`/`)

#### Structure actuelle (9 sections)
Hero → Mission → Axes → Campagnes → Témoignages → Actualités → Live → CTA → Newsletter

#### Structure cible (6 sections)

```
┌─────────────────────────────────────────────────────────┐
│  SECTION 1 — HERO FULL-VIEWPORT                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │  [Vidéo FIKIN loop / photo familles en fond]        ││
│  │  Overlay navy 60%                                   ││
│  │                                                     ││
│  │  ASBL — RDC (label gold)                            ││
│  │  Cri de Familles Militaires (H1, Playfair, blanc)   ││
│  │  Tagline (1 ligne)                                  ││
│  │  [Demander de l'aide]  [S'engager]  (2 CTA max)    ││
│  └─────────────────────────────────────────────────────┘│
│  Composant : <HeroMedia> + animations cascade           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SECTION 2 — MISSION + CHIFFRES CLÉS                    │
│  ┌──────────────────┬──────────────────────────────────┐│
│  │  Photo familles  │  Titre section                   ││
│  │  ou FIKIN        │  Texte mission (3 lignes max)    ││
│  │  (media-frame)   │  Lien « En savoir plus → »       ││
│  │                  │  ┌──────┬──────┬──────────────┐  ││
│  │                  │  │ 2018 │  26  │  FIKIN 2025  │  ││
│  │                  │  │ fond.│ prov.│  rassemblem. │  ││
│  │                  │  └──────┴──────┴──────────────┘  ││
│  └──────────────────┴──────────────────────────────────┘│
│  Composants : <ScrollReveal>, <StatCounter>             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SECTION 3 — NOS AXES (scroll horizontal mobile)        │
│  Titre centré + sous-titre                              │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ Photo  │ │ Photo  │ │ Photo  │ │ Photo  │ │Photo │ │
│  │ Social │ │ Écono. │ │ Éduca. │ │ Envir. │ │Santé │ │
│  │ +icon  │ │ +icon  │ │ +icon  │ │ +icon  │ │+icon │ │
│  └────────┘ └────────┘ └────────┘ └────────┘ └──────┘ │
│  Composants : <MediaCard>, scroll-snap mobile           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SECTION 4 — LIVE & ÉVÉNEMENT (conditionnel)            │
│  Si live actif :                                        │
│  ┌──────────────────────────┬───────────────────────────┐│
│  │  Mini-player / thumbnail │  Titre + description      ││
│  │  Badge EN DIRECT pulse   │  [Rejoindre le live]      ││
│  └──────────────────────────┴───────────────────────────┘│
│  Sinon : bandeau « Prochain événement » + date          │
│  Composants : <LiveBadge>, <LivePlayer> miniature       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SECTION 5 — TÉMOIGNAGES                                │
│  Fond navy, texte blanc                                 │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Carousel horizontal snap                           ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐          ││
│  │  │ Portrait │  │ Portrait │  │ Portrait │          ││
│  │  │ + quote  │  │ + quote  │  │ + quote  │          ││
│  │  │ + auteur │  │ + auteur │  │ + auteur │          ││
│  │  └──────────┘  └──────────┘  └──────────┘          ││
│  └─────────────────────────────────────────────────────┘│
│  Composant : <TestimonialCarousel>                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SECTION 6 — CTA FINAL + NEWSLETTER                     │
│  Fond crème ou warm/10                                  │
│  Titre : « Rejoignez le mouvement »                     │
│  Sous-titre (2 lignes)                                  │
│  [S'engager]  [Faire un don]                            │
│  NewsletterForm centrée                                 │
└─────────────────────────────────────────────────────────┘
```

**Sections supprimées / fusionnées :**
- Campagnes → intégrées dans section 3 ou page Plaidoyer
- Actualités → 3 `<MediaCard>` max dans section 2 ou lien vers Plaidoyer
- Section live basique → remplacée par section 4 conditionnelle

---

### 8.2 À propos (`/a-propos`)

```
┌─────────────────────────────────────────────────────────┐
│  PAGE HERO                                                │
│  <PageHero> avec photo FIKIN ou fondateur en fond        │
│  Titre : « Qui sommes-nous »                             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  SPLIT HISTOIRE                                           │
│  ┌──────────────────┬──────────────────────────────────┐ │
│  │  Photo fondateur │  Texte histoire CFM              │ │
│  │  ou équipe       │  Fondation 2018, parcours        │ │
│  └──────────────────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  TIMELINE VERTICALE ANIMÉE                                │
│  2018 ─── Fondation CFM                                   │
│  2020 ─── Premières actions terrain                       │
│  2025 ─── FIKIN — Rassemblement historique [photo]        │
│  2026 ─── Live, PWA, multilingue                          │
│  Composant : <TimelineVertical>                           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  BLOC FIKIN 2025 (highlight)                              │
│  Grande photo + citation + texte événement                │
│  Composant : <HeroMedia> miniature                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  GALERIE FIKIN                                            │
│  Grille 3 colonnes, 8–12 photos                          │
│  Lightbox au clic                                         │
│  Composant : <ImageGallery>                               │
└─────────────────────────────────────────────────────────┘

┌──────────────────┬──────────────────────────────────────┐
│  Sidebar         │  Vision + citation                   │
│  « En bref »     │  Gouvernance + transparence          │
│  (conserver)     │                                      │
└──────────────────┴──────────────────────────────────────┘
```

---

### 8.3 Nos axes (`/axes`)

Pour chaque axe (5 sections en zigzag alterné) :

```
Section paire (index 0, 2, 4) :
┌──────────────────┬──────────────────────────────────┐
│  Photo thématique│  Badge icône + Titre H2           │
│  (media-frame)   │  Description                     │
│  Slide from ←    │  Liste actions prioritaires       │
└──────────────────┴──────────────────────────────────┘

Section impaire (index 1, 3) :
┌──────────────────────────────────┬──────────────────┐
│  Badge icône + Titre H2           │  Photo thématique│
│  Description                     │  (media-frame)   │
│  Liste actions prioritaires       │  Slide from →    │
└──────────────────────────────────┴──────────────────┘
```

- Remplacer la `card` placeholder par une vraie photo
- Icône Lucide → petit badge en overlay coin supérieur de l'image
- Animation slide alternée au scroll

---

### 8.4 Actions (`/actions`)

```
┌─────────────────────────────────────────────────────────┐
│  PAGE HERO : « Actions nationales & régionales »          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  LAYOUT 2 COLONNES                                        │
│  ┌──────────────────┬──────────────────────────────────┐ │
│  │  Carte SVG RDC   │  Liste actions filtrées          │ │
│  │  interactive     │                                  │ │
│  │  26 provinces    │  ┌────────────────────────────┐  │ │
│  │  hover = highlight│  │ MediaCard par action      │  │ │
│  │  click = filtre  │  │ photo + titre + province    │  │ │
│  │                  │  │ + date + type badge         │  │ │
│  │  Composant :     │  └────────────────────────────┘  │ │
│  │  <RDCCMap>       │  Animation layout on filter      │ │
│  └──────────────────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

### 8.5 Live (`/live` et `/live/[slug]`)

#### Liste (`/live`)

```
┌─────────────────────────────────────────────────────────┐
│  Si live actif : HERO avec player intégré + badge pulse  │
│  PushSubscribeButton                                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  GRILLE ÉVÉNEMENTS (style YouTube)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Thumbnail    │  │ Thumbnail    │  │ Thumbnail    │    │
│  │ 16:9         │  │ 16:9         │  │ 16:9         │    │
│  │ Badge statut │  │ Badge statut │  │ Badge statut │    │
│  │ Titre        │  │ Titre        │  │ Titre        │    │
│  │ Description  │  │ Description  │  │ Description  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│  Composant : <MediaCard> avec thumbnail                   │
└─────────────────────────────────────────────────────────┘
```

#### Live individuel (`/live/[slug]`)

```
Desktop :
┌────────────────────────────────┬─────────────────────┐
│  Player vidéo (2/3)            │  Chat (1/3)         │
│  <LivePlayer> media-frame      │  <LiveChat>         │
│  Titre + description           │  <LivePolls>        │
└────────────────────────────────┴─────────────────────┘

Mobile :
Player pleine largeur → Chat en dessous → Sondages
```

---

### 8.6 Plaidoyer (`/plaidoyer`)

- Hero avec image campagne active
- Grille `<MediaCard>` pour chaque campagne/actualité avec vignette
- Filtres par catégorie (rapport, campagne, actualité) avec transition layout
- Études : couverture PDF visualisée comme image

---

### 8.7 S'engager (`/s-engager`)

- Bandeau photo communautaire en `<PageHero>`
- 3 cartes adhésion avec icône + photo de fond subtile
- Section don : confiance visuelle (cadenas, transparence)
- Formulaires dans `glass-card` sur fond crème

---

### 8.8 Contact (`/contact`)

- `<PageHero>` sobre
- Split : formulaire aide (gauche) + infos contact (droite)
- Carte de confiance : « Vos données sont chiffrées et confidentielles »
- Photo discret en fond (floutée) pour humaniser

---

### 8.9 Presse (`/presse`)

- `<MediaCard>` pour chaque communiqué avec visuel
- Section téléchargements avec icônes PDF
- Logos partenaires presse si disponibles

---

### 8.10 Pages membre & admin

| Zone | Traitement design |
|------|-------------------|
| Connexion / inscription | Fond crème, formulaire centré `glass-card`, logo CFM |
| Tableau de bord membre | Conserver layout fonctionnel, ajouter avatar/photo |
| Admin dashboard | Pas de refonte majeure — ajouter upload média |

---

## 9. Espace admin & gestion média

### 9.1 Fonctionnalités admin à ajouter

| Fonctionnalité | Description |
|----------------|-------------|
| **Upload image** | Champ file → stockage `public/media/` → chemin dans `store.json` |
| **Gestion hero** | Modifier image/vidéo hero depuis admin |
| **Galerie FIKIN** | Ajouter/supprimer photos galerie |
| **Thumbnail live** | Upload thumbnail par événement live |
| **Vignette article** | Upload cover image par actualité/campagne |
| **Photo témoignage** | Upload portrait (avec flag anonymat → floutage auto optionnel) |

### 9.2 Workflow upload

```
Admin sélectionne fichier
  → Validation (type: webp/jpg/png/mp4, taille max: 5 Mo)
  → Compression auto (Sharp : resize + WebP)
  → Stockage public/media/{category}/
  → Enregistrement chemin dans store.json
  → Preview immédiate dans admin
```

---

## 10. Performance & accessibilité

### 10.1 Objectifs performance (alignés V4)

| Métrique | Cible | Contexte |
|----------|-------|----------|
| LCP (Largest Contentful Paint) | < 2,5 s | Hero image optimisée, `priority` |
| FID (First Input Delay) | < 100 ms | Pas de JS bloquant |
| CLS (Cumulative Layout Shift) | < 0,1 | Dimensions images fixées |
| Poids page accueil | < 800 Ko | Mobile 3G |
| Page accueil 3G | < 5 s | Lighthouse mobile 3G |
| Vidéo hero | < 3 Mo | MP4 H.264, 15–30 s |

### 10.2 Stratégies d'optimisation

| Technique | Application |
|-----------|-------------|
| `next/image` | Toutes les images, formats WebP/AVIF auto |
| Lazy load | Tout sauf hero above-the-fold |
| `priority` | Hero image, logo header |
| Responsive images | `sizes` adapté par breakpoint |
| Vidéo conditionnelle | Poster statique sur mobile / 3G, vidéo sur WiFi |
| Font subsetting | Déjà OK via `next/font` |
| Code splitting | Framer Motion import dynamique si possible |
| CDN | Cloudflare (prévu V4) pour assets statiques |
| Service Worker | Cache images visitées (PWA existante) |

### 10.3 Détection connexion (optionnel)

```javascript
// Pseudo-code : afficher vidéo seulement si connexion rapide
const connection = navigator.connection || navigator.mozConnection;
const isSlowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === '3g';
// Si slow → poster image statique
// Si fast → vidéo loop
```

### 10.4 Accessibilité (WCAG 2.1 AA)

| Critère | Application |
|---------|-------------|
| Contraste texte | Min 4.5:1 (corps), 3:1 (titres large) — vérifier gold sur crème |
| Alt text | Obligatoire sur toutes les images (`coverImageAlt` dans store) |
| Focus visible | Ring gold sur tous les éléments interactifs |
| Navigation clavier | Carousel, lightbox, carte RDC navigables au clavier |
| `prefers-reduced-motion` | Désactiver toutes animations décoratives |
| Langue | `lang` attribute déjà en place, conserver par locale |
| Formulaires | Labels, erreurs, aria-describedby |
| Vidéo | Pas d'autoplay sonore, contrôles accessibles |

---

## 11. Phases d'implémentation

### Phase D1 — Fondations visuelles (1–2 semaines)

| # | Tâche | Livrable |
|---|-------|----------|
| D1.1 | Collecte / shooting photos FIKIN + familles | 15–20 photos brutes avec consentements |
| D1.2 | Compression & placement médias | Dossier `public/media/` structuré |
| D1.3 | Extension modèle de données | Champs média dans `store.json` |
| D1.4 | Installation Framer Motion | Dépendance + config de base |
| D1.5 | Création composants UI core | `HeroMedia`, `ScrollReveal`, `MediaCard` |
| D1.6 | Enrichissement design system | Nouvelles classes Tailwind / CSS |
| D1.7 | Refonte hero accueil | Section 1 opérationnelle avec photo |

**Critère de fin D1 :** Hero accueil avec image réelle, animation cascade, responsive OK.

---

### Phase D2 — Pages clés (2 semaines)

| # | Tâche | Livrable |
|---|-------|----------|
| D2.1 | Refonte complète accueil | 6 sections opérationnelles |
| D2.2 | Page À propos | Timeline + galerie FIKIN |
| D2.3 | Page Axes | 5 photos thématiques + slide alterné |
| D2.4 | Page Live | Thumbnails + hero conditionnel |
| D2.5 | Page Plaidoyer | MediaCards avec vignettes |
| D2.6 | `<PageHero>` uniforme | Sous-hero sur toutes pages intérieures |
| D2.7 | `<TestimonialCarousel>` | Section témoignages accueil |

**Critère de fin D2 :** 5 pages principales avec médias réels, cohérence visuelle.

---

### Phase D3 — Animations & polish (1 semaine)

| # | Tâche | Livrable |
|---|-------|----------|
| D3.1 | Scroll reveals globaux | `<ScrollReveal>` sur toutes sections |
| D3.2 | Header shrink + transitions | Header animé au scroll |
| D3.3 | Compteurs animés | `<StatCounter>` section mission |
| D3.4 | Hover states complets | Boutons, cartes, images |
| D3.5 | `prefers-reduced-motion` | Media query globale |
| D3.6 | Page transitions | Fade 200 ms entre routes |
| D3.7 | `<LiveBadge>` pulse | Badge live amélioré |

**Critère de fin D3 :** Site fluide, animations subtiles, accessible.

---

### Phase D4 — Interactivité avancée & admin (1 semaine)

| # | Tâche | Livrable |
|---|-------|----------|
| D4.1 | `<RDCCMap>` interactive | Carte SVG page Actions |
| D4.2 | `<ImageGallery>` + lightbox | Galerie FIKIN page À propos |
| D4.3 | Upload média admin | Interface admin upload images |
| D4.4 | Vidéo hero conditionnelle | `<VideoBackground>` avec fallback |
| D4.5 | Audit Lighthouse mobile 3G | Rapport performance |
| D4.6 | Corrections performance | Optimisations post-audit |

**Critère de fin D4 :** Carte RDC interactive, admin upload, Lighthouse > 80 mobile.

---

### Phase D5 — Finalisation (3–5 jours)

| # | Tâche | Livrable |
|---|-------|----------|
| D5.1 | Revue i18n visuelle | Layouts OK en LN/SW (textes plus longs) |
| D5.2 | Revue accessibilité | Audit WCAG, corrections |
| D5.3 | Tests cross-browser | Chrome, Firefox, Safari, Edge mobile |
| D5.4 | Tests devices RDC | Android milieu de gamme, 3G simulé |
| D5.5 | Documentation composants | Storybook ou README composants UI |

**Critère de fin D5 :** Site prêt pour production design.

---

### Calendrier global

```
Semaine 1–2   : Phase D1 (Fondations)
Semaine 3–4   : Phase D2 (Pages clés)
Semaine 5     : Phase D3 (Animations)
Semaine 6     : Phase D4 (Interactivité + admin)
Semaine 6–7   : Phase D5 (Finalisation)
─────────────────────────────────────────
Total estimé  : 6–7 semaines
```

---

## 12. Livrables & critères de validation

### 12.1 Livrables design

| Livrable | Format | Description |
|----------|--------|-------------|
| Banque de médias CFM | Dossier `public/media/` | 30+ images optimisées WebP |
| Vidéo hero | MP4 < 3 Mo | Loop FIKIN 15–30 s |
| Design system documenté | Ce fichier + `globals.css` | Tokens, classes, composants |
| 12 composants UI | `src/components/ui/` | Liste section 7 |
| 5 pages refondues | Pages Next.js | Accueil, À propos, Axes, Live, Actions |
| Admin upload média | Panel admin | Upload + preview images |
| Rapport Lighthouse | PDF / screenshot | Mobile 3G > 80 performance |

### 12.2 Critères de validation design

| Critère | Cible | Méthode de test |
|---------|-------|-----------------|
| Hero avec média réel | Photo ou vidéo FIKIN | Inspection visuelle |
| Animations scroll | Reveal sur 80 % des sections | Scroll test |
| Images optimisées | 100 % via `next/image` | Audit code |
| Poids page accueil | < 800 Ko mobile | Lighthouse |
| LCP | < 2,5 s | Lighthouse mobile 3G |
| Accessibilité | WCAG 2.1 AA | axe DevTools |
| Reduced motion | Animations désactivées | OS setting test |
| i18n visuel | Pas de débordement LN/SW | Test 4 langues |
| Responsive | 320px → 1920px | Chrome DevTools |
| Cohérence | Même design system partout | Revue toutes pages |

### 12.3 Critères qualitatifs

| Question | Réponse attendue |
|----------|------------------|
| Le site provoque-t-il une émotion ? | Oui — photos familles, FIKIN |
| La cause est-elle immédiatement compréhensible ? | Oui — hero + mission en 5 secondes |
| Le site fait-il professionnel / crédible ? | Oui — navy + or + typographie |
| L'expérience est-elle fluide sur 3G ? | Oui — < 5 s chargement |
| Les animations gênent-elles la lecture ? | Non — subtiles, désactivables |

---

## 13. Annexes

### 13.1 Dépendances à ajouter (implémentation future)

| Package | Version | Usage |
|---------|---------|-------|
| `framer-motion` | ^11.x | Animations scroll, layout, page transitions |
| `sharp` | ^0.33.x | Compression images côté serveur (upload admin) |

> Pas d'autre dépendance design nécessaire. Tailwind + Framer Motion + next/image suffisent.

### 13.2 Fichiers existants impactés

| Fichier | Nature de modification |
|---------|----------------------|
| `tailwind.config.ts` | Nouveaux tokens couleurs, animations |
| `src/app/globals.css` | Nouvelles classes utilitaires |
| `src/app/(site)/page.tsx` | Refonte complète (6 sections) |
| `src/app/(site)/a-propos/page.tsx` | Timeline + galerie |
| `src/app/(site)/axes/page.tsx` | Photos thématiques |
| `src/app/(site)/actions/page.tsx` | Carte RDC interactive |
| `src/app/(site)/live/page.tsx` | Thumbnails événements |
| `src/app/(site)/plaidoyer/page.tsx` | MediaCards vignettes |
| `src/components/Header.tsx` | Shrink scroll |
| `data/store.json` | Champs média |
| `package.json` | framer-motion, sharp |

### 13.3 Fichiers à créer

```
src/components/ui/
├── HeroMedia.tsx
├── ScrollReveal.tsx
├── MediaCard.tsx
├── TestimonialCarousel.tsx
├── StatCounter.tsx
├── VideoBackground.tsx
├── ImageGallery.tsx
├── SectionDivider.tsx
├── LiveBadge.tsx
├── PageHero.tsx
├── RDCCMap.tsx
├── TimelineVertical.tsx
└── Lightbox.tsx

public/media/
├── hero/
├── fikin-2025/
├── axes/
├── temoignages/
├── equipe/
├── live/
├── actualites/
├── partenaires/
└── illustrations/
```

### 13.4 Checklist consentements médias

Avant tout shooting ou publication :

- [ ] Autorisation écrite de chaque personne identifiable
- [ ] Option anonymat (floutage visage) proposée systématiquement
- [ ] Consentement parental pour les mineurs
- [ ] Droit de retrait post-publication garanti
- [ ] Pas de localisation précise si risque sécurité
- [ ] Validation comité CFM avant publication site

### 13.5 Glossaire

| Terme | Définition |
|-------|------------|
| **Hero** | Section plein écran en haut de page, première impression |
| **Reveal** | Animation d'apparition progressive au scroll |
| **MediaCard** | Carte avec image 16:9 + texte + lien |
| **Glass-card** | Carte semi-transparente avec backdrop-blur |
| **LCP** | Largest Contentful Paint — métrique de vitesse de chargement |
| **WebP** | Format image optimisé pour le web |
| **Scroll-snap** | CSS natif pour carousel horizontal fluide |
| **Lightbox** | Visionneuse plein écran pour agrandir une image |

---

*Document rédigé pour CFM ASBL — Plan design V1.*  
*Prochaine étape : validation du plan → Phase D1 (collecte médias + composants core).*  
*Ce document ne contient aucune implémentation code — référence design uniquement.*
