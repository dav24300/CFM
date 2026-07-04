# QA — Lighthouse & accessibilité médias

Checklist manuelle après changements Design & médias.

## Lighthouse (accueil `/`)

Cible : **LCP < 2,5 s**, Performance ≥ 85.

1. Ouvrir Chrome DevTools → Lighthouse → Mobile
2. Mesurer `/` en production (pas localhost throttled)
3. Points d'attention :
   - Hero image : format WebP, dimensions adaptées (Sharp si `CFM_IMAGE_COMPRESS=true`)
   - Cache `cfm:media-settings` actif (TTL 300s par défaut)
   - Pas d'images PNG 4K non compressées

### Actions si LCP > 2,5 s

- Activer `CFM_IMAGE_COMPRESS=true` sur VPS
- Vérifier Cloudflare CDN sur `/media/*`
- Réduire taille hero via admin (max 1920px large)

## WCAG — textes alternatifs

| Zone | Champ admin | Page |
|------|-------------|------|
| Hero | `hero_image_alt` | `/` |
| Mission | `mission_image_alt` | `/` |
| Galerie FIKIN | `alt` par item | `/`, `/a-propos` |
| Bibliothèque | `alt` sur upload | Toutes |
| Actualités | `cover_image_alt` | `/actualites/*` |
| Axes | titres des cartes | `/axes` |

### Vérification

- [ ] Toutes les `<Image>` hero/mission ont un `alt` non vide
- [ ] Galerie FIKIN : chaque item a `alt` renseigné en admin
- [ ] Témoignages anonymes : portrait fallback avec alt générique
- [ ] Live thumbnails : `thumbnail_alt` ou titre événement

## Outils

- [WAVE](https://wave.webaim.org/) sur `/` et `/a-propos`
- Lighthouse Accessibility score cible : ≥ 90

---

*CFM ASBL — QA médias — juillet 2026*
