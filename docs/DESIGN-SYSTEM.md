# Design system CFM ASBL

Source canonique du design system. Aperçu vivant : **`/admin/style-guide`** (réservé admin, `noindex`).

## Deux familles, un scope de thème

| Famille | Portée | Identité | Coins |
|---|---|---|---|
| **site** | public + **portail** | bleu institutionnel `#14418a`, serif Newsreader | nets (0px) |
| **admin** | console `/admin` | teal `#127d73`, Space Grotesk / IBM Plex | 8px |

Le **thème sombre existe pour l'admin uniquement**. Le site public et le portail restent clairs.

## Tokens

Définis dans [`tailwind.config.ts`](../tailwind.config.ts) (classes `bg-site-*`, `text-admin-*`, …) et en variables CSS dans [`src/app/globals.css`](../src/app/globals.css).

- **`site-*`** : hex figés (pas de dark). Ex. `site-primary`, `site-ink`, `site-danger`, `site-navy`, `site-hero-dark`, `site-hero-eyebrow`, statuts `site-warn/info/ok-fg` + `-bg`.
- **`admin-*`** : **canaux RGB** (`rgb(var(--admin-x) / <alpha-value>)`) — obligatoire pour préserver les opacités (`bg-admin-accent/80`) **et** permettre le flip sombre. Valeurs claires sous `.theme-admin`, sombres sous `.theme-admin.dark`.

> ⚠️ **Opacité + variable CSS** : `bg-[var(--x)]/30` n'applique pas l'alpha. Pour un token exposé via utilitaire Tailwind avec `/opacity` → canaux. Pour un `--control-*` (anneaux, overlays) → alpha bakée dans un token dédié.

## Control tokens (`--control-*`) — le cœur des primitives

Les primitives (`src/components/ui/primitives`) ne référencent **jamais** `site-*` ou `admin-*` en dur. Elles lisent une couche neutre `--control-*` résolue par le **scope de thème ambiant** :

- `:root, .theme-site` → accent bleu, `--control-radius: 0px`, bordure hairline…
- `.theme-admin` → accent teal, `--control-radius: 8px`…
- `.theme-admin.dark` → surfaces + control tokens sombres.

Scopes posés : `theme-site` sur `<body>` ([`layout.tsx`](../src/app/layout.tsx)), `theme-admin` sur le wrapper de [`admin/layout.tsx`](../src/app/admin/layout.tsx). Le portail hérite de `body.theme-site`.

**Écrire une primitive thématisable** : consommer `bg-[var(--control-accent)]`, `rounded-[var(--control-radius)]`, `border-[var(--control-border)]`, `focus-visible:ring-[var(--control-ring)]`, `text-[var(--control-fg)]` — jamais `site-primary`/`gray-300`/`rounded-lg`. Les classes arbitraires doivent être **littérales** dans le source (le JIT Tailwind n'expanse pas les classes construites dynamiquement).

## Thème sombre admin

- Bascule : `AdminThemeToggle` (header) écrit le cookie `cfm-admin-theme` et met à jour la classe `.dark` sur le wrapper `.theme-admin` et sur `<body>`.
- SSR : `admin/layout.tsx` lit le cookie et rend la classe → **pas de FOUC**.
- Portails Radix : `AdminThemeSync` réplique `theme-admin`/`.dark` sur `<body>` pendant `/admin` pour que Dialog/Select (portalés hors du sous-arbre) héritent du thème.

## Primitives

`Button` · `Input` · `Textarea` · `Label` · `Badge` (`default`/`accent`/`live`/`muted`) · `Alert` · `Spinner` · `Skeleton` · `Dialog` · `Select` · `Tabs` (Radix). Patterns : `FormField`, `FormSelect`, `ButtonLink`, `Section`, `EmptyState`, `AsyncBoundary`. Voir [`src/components/ui/README.md`](../src/components/ui/README.md).

## Migration en cours (état)

- ✅ Primitives thématisables, thème sombre admin, tokens site complétés, hex dupliquant un token remplacés.
- ⏳ Reste : finir l'adoption des primitives dans le portail et remplacer les `<button>/<a>` bruts `bg-site-primary` restants par `Button`/`ButtonLink` (rendu déjà correct, dette de cohérence).
