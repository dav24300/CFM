import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-access";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { Label } from "@/components/ui/primitives/label";
import { Badge } from "@/components/ui/primitives/badge";
import { Alert } from "@/components/ui/primitives/alert";
import { ShowcaseIsland } from "@/app/admin/style-guide/ShowcaseIsland";

export const metadata: Metadata = {
  title: "Design system — CFM",
  robots: { index: false, follow: false },
};

const SITE_TOKENS = [
  "ink", "muted", "muted-2", "hairline", "surface", "primary", "primary-dark",
  "deep", "navy", "light", "pale", "live", "success", "danger",
] as const;

const ADMIN_TOKENS = [
  "bg", "surface", "sidebar", "ink", "muted", "border", "accent", "accent-dark",
  "accent-fg", "deep", "warn-fg", "ok-fg", "info-fg", "danger-fg",
] as const;

const BUTTON_VARIANTS = ["primary", "secondary", "outline", "ghost", "destructive"] as const;

/** Palette de démonstration des primitives dans un scope de thème donné. */
function ControlsShowcase({ title }: { title: string }) {
  return (
    <div className="space-y-6 border border-[var(--control-border)] bg-[var(--control-bg)] p-6">
      <h3 className="font-semibold text-[var(--control-fg)]">{title}</h3>

      <div className="flex flex-wrap items-center gap-3">
        {BUTTON_VARIANTS.map((v) => (
          <Button key={v} variant={v} size="sm">
            {v}
          </Button>
        ))}
        <Button size="sm" loading>
          loading
        </Button>
        <Button size="sm" disabled>
          disabled
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor={`inp-${title}`} required>
            Champ
          </Label>
          <Input id={`inp-${title}`} placeholder="Saisir…" />
        </div>
        <div>
          <Label>Erreur</Label>
          <Input variant="error" defaultValue="Valeur invalide" />
        </div>
        <div>
          <Label>Succès</Label>
          <Input variant="success" defaultValue="Valeur valide" />
        </div>
      </div>

      <Textarea placeholder="Zone de texte…" rows={2} />

      <div className="flex flex-wrap gap-2">
        <Badge>default</Badge>
        <Badge variant="accent">accent</Badge>
        <Badge variant="live">live</Badge>
        <Badge variant="muted">muted</Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Alert variant="info">Message d’information</Alert>
        <Alert variant="success">Opération réussie</Alert>
        <Alert variant="warning">Attention requise</Alert>
        <Alert variant="error">Une erreur est survenue</Alert>
      </div>
    </div>
  );
}

function Swatches({ family, tokens }: { family: "site" | "admin"; tokens: readonly string[] }) {
  // Couleurs via style inline (les classes dynamiques bg-${family}-${t} ne seraient
  // pas générées par le JIT Tailwind). site-* = couleurs pleines, admin-* = canaux → rgb().
  const color = (t: string) =>
    family === "site" ? `var(--site-${t})` : `rgb(var(--admin-${t}))`;
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {tokens.map((t) => (
        <div key={t} className="overflow-hidden border border-admin-border text-[11px]">
          <div className="h-12" style={{ background: color(t) }} />
          <div className="bg-admin-surface px-2 py-1 font-mono text-admin-muted">
            {family}-{t}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function StyleGuidePage() {
  const access = await getAdminAccess();
  if (!access) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-admin-accent">
          Référence interne
        </p>
        <h1 className="font-display text-3xl font-bold text-admin-ink">Design system CFM</h1>
        <p className="mt-2 max-w-2xl text-sm text-admin-muted">
          Aperçu vivant des tokens et primitives. Les primitives sont thématisées par le scope
          ambiant (<code className="font-mono">.theme-site</code> /{" "}
          <code className="font-mono">.theme-admin</code>) via les variables{" "}
          <code className="font-mono">--control-*</code> — aucune couleur codée en dur.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-admin-ink">Tokens — famille site</h2>
        <Swatches family="site" tokens={SITE_TOKENS} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-admin-ink">Tokens — famille admin</h2>
        <Swatches family="admin" tokens={ADMIN_TOKENS} />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-lg font-semibold text-admin-ink">Typographie</h2>
        <div className="space-y-2 border border-admin-border bg-admin-surface p-6">
          <p className="font-serif text-3xl text-admin-ink">Serif éditorial — Newsreader</p>
          <p className="font-sans text-lg text-admin-ink">Sans corps — Archivo</p>
          <p className="font-display text-lg font-semibold text-admin-ink">Display — Space Grotesk</p>
          <p className="font-mono text-sm text-admin-muted">Mono — IBM Plex Mono</p>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-lg font-semibold text-admin-ink">
          Primitives par thème (coins nets 0px site / 8px admin)
        </h2>
        {/* Chaque bloc établit son propre scope de thème pour prévisualiser côte à côte. */}
        <div className="theme-site">
          <ControlsShowcase title="Thème site (bleu, coins nets)" />
        </div>
        <div className="theme-admin">
          <ControlsShowcase title="Thème admin (bleu, coins 10px)" />
        </div>
        <div className="theme-admin dark">
          <ControlsShowcase title="Thème admin — sombre" />
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="font-display text-lg font-semibold text-admin-ink">
          Composants admin premium
        </h2>
        <p className="max-w-2xl text-sm text-admin-muted">
          DataTable (recherche, tri, filtres, sélection groupée, menu kebab, squelette),
          slide-over animé (champs routés sur les primitives) et dialogue de confirmation.
          Données fictives.
        </p>
        <ShowcaseIsland />
      </section>
    </div>
  );
}
