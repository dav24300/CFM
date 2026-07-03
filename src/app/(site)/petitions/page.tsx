import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/patterns/button-link";
import { getActivePetitions } from "@/lib/members";
import { getTranslations } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Pétitions" };

export default async function PetitionsPage() {
  const petitions = getActivePetitions();
  const { t } = await getTranslations();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="section-title">{t.petitions.title}</h1>
      <p className="section-subtitle max-w-3xl">{t.petitions.subtitle}</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {petitions.map((p) => {
          const progress = Math.min(100, Math.round((p.signatures_count / p.goal) * 100));
          return (
            <article key={p.slug} className="card">
              <h2 className="font-display text-xl font-bold">{p.title}</h2>
              <p className="mt-2 text-cfm-earth">{p.description}</p>
              <div className="mt-4">
                <div className="flex justify-between text-sm">
                  <span>{p.signatures_count} {t.petitions.signatures}</span>
                  <span>{t.petitions.goal} : {p.goal}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-cfm-cream">
                  <div className="h-2 rounded-full bg-cfm-gold" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <ButtonLink href={`/petitions/${p.slug}`} size="sm" className="mt-4">
                {t.petitions.sign}
              </ButtonLink>
            </article>
          );
        })}
      </div>
    </div>
  );
}
