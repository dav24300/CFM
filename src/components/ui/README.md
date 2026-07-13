# Composants UI — CFM ASBL

Architecture en 3 couches pour une UI production-ready, accessible et réutilisable.

> **Design system & tokens** : voir [`docs/DESIGN-SYSTEM.md`](../../../docs/DESIGN-SYSTEM.md) (familles `site`/`admin`, control tokens `--control-*`, thème sombre admin). Aperçu vivant : `/admin/style-guide`.
>
> **Primitive thématisable** : une primitive consomme les `--control-*` (`bg-[var(--control-accent)]`, `rounded-[var(--control-radius)]`, `focus-visible:ring-[var(--control-ring)]`…), **jamais** `site-primary`/`gray-300`/`rounded-lg` en dur — c'est ce qui lui permet de rendre en bleu (site) ou teal (admin) selon le scope ambiant.

## Hiérarchie

```
patterns/     → FormField, EmptyState, AsyncBoundary, Section, FormSelect
primitives/   → Button, Input, Textarea, Label, Badge, Alert, Spinner, Skeleton, Dialog, Select, Tabs
ui/*.tsx      → Composants média & layout (HeroMedia, MediaCard, …)
```

**Règle** : importer les primitives et patterns par leur chemin (`@/components/ui/primitives/button`, `@/components/ui/patterns/form-field`). Le barrel `@/components/ui` a été **supprimé** — l'import est verrouillé par la règle ESLint `no-restricted-imports`. Ne pas importer Radix directement hors `primitives/`.

## Primitives

| Composant | Variants | Usage |
|-----------|----------|-------|
| `Button` | `primary`, `secondary`, `outline`, `outlineLight`, `ghost`, `destructive` | CTA, soumissions formulaire |
| `Input` | `default`, `error`, `success`, `footer` | Champs texte |
| `Textarea` | idem + `showCount` | Messages longs |
| `Alert` | `info`, `success`, `warning`, `error` | Retours utilisateur |
| `Skeleton` | `text`, `circle`, `rect`, `card` | États de chargement |
| `Dialog` | — | Lightbox, modales |
| `Select` / `FormSelect` | — | Province, filtres |
| `Tabs` | — | Panneaux admin |

## Exemples

```tsx
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { EmptyState } from "@/components/ui/patterns/empty-state";
import { useAsyncAction } from "@/lib/hooks/use-async-action";

function MyForm() {
  const { isLoading, isError, error, run } = useAsyncAction();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await run(async () => {
      const res = await fetch("/api/...", { method: "POST", body: JSON.stringify({}) });
      if (!res.ok) throw new Error("Erreur");
    });
  }

  return (
    <form onSubmit={onSubmit}>
      <FormField label="Email" htmlFor="email" required>
        <Input type="email" required />
      </FormField>
      <Button type="submit" loading={isLoading}>Envoyer</Button>
      {isError && error && <Alert variant="error">{error}</Alert>}
    </form>
  );
}
```

```tsx
<AsyncBoundary
  isLoading={loading}
  isEmpty={items.length === 0}
  loading={<SkeletonList count={3} variant="card" />}
  empty={<EmptyState title="Aucun résultat" />}
>
  {children}
</AsyncBoundary>
```

## Migration depuis classes CSS legacy

| Avant | Après |
|-------|-------|
| `className="btn-primary"` | `<Button variant="primary">` |
| `className="input-field"` | `<Input />` ou `<NativeSelect />` |
| `<p>Chargement...</p>` | `<SkeletonList />` ou `<Spinner />` |
| message succès/erreur inline | `<Alert variant="success\|error">` |

Les classes `.btn-primary`, `.input-field`, `.card` restent dans `globals.css` pour compatibilité ascendante.

## Checklist accessibilité

- [ ] Chaque champ a un `<Label htmlFor>` via `FormField`
- [ ] Erreurs liées avec `aria-invalid` + `aria-describedby`
- [ ] Boutons loading : `aria-busy` (automatique sur `Button`)
- [ ] Modales : Radix Dialog (focus trap natif)
- [ ] Carousel : navigation clavier + `aria-roledescription`
- [ ] Images : `alt` obligatoire ; décoratif → `alt=""` + `aria-hidden`
- [ ] `prefers-reduced-motion` respecté (HeroMedia, ScrollReveal, carousel)

## Tests

```bash
npm run test -- __tests__/ui/
```
