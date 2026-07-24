import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/patterns/button-link";
import { getActivePetitionsCached } from "@/infrastructure/cache/petitions-cache";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getTranslationsFor } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Pétitions" };

export default async function PetitionsPage() {
  const petitions = await getActivePetitionsCached();
  const { locale, t } = await getTranslationsFor("fr");

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: locale === "en" ? "Home" : "Accueil", href: "/" }, { label: t.petitions.title }]}
        kicker={locale === "en" ? "Citizen mobilisation" : "Mobilisation citoyenne"}
        title={t.petitions.title}
        subtitle={t.petitions.subtitle}
      />

      <div className="mx-auto max-w-site px-6 py-20">
        <ScrollReveal>
          <div className="grid gap-5 md:grid-cols-2">
            {petitions.map((p) => {
              const progress = Math.min(100, Math.round((p.signatures_count / p.goal) * 100));
              return (
                <article key={p.slug} className="flex flex-col border border-site-hairline bg-white p-7">
                  <h2 className="font-serif text-xl font-medium text-site-ink">{p.title}</h2>
                  <p className="mt-2 flex-1 text-site-muted">{p.description}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-site-muted-2">
                      <span className="font-semibold text-site-ink">
                        {p.signatures_count} {t.petitions.signatures}
                      </span>
                      <span>
                        {t.petitions.goal} : {p.goal}
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 bg-site-surface">
                      <div className="h-2 bg-site-primary" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <ButtonLink
                    href={`/petitions/${p.slug}`}
                    size="sm"
                    className="mt-5 self-start"
                    data-cta="cta_petition"
                  >
                    {t.petitions.sign}
                  </ButtonLink>
                </article>
              );
            })}
          </div>
        </ScrollReveal>

        <ScrollReveal className="mt-12">
          <div className="border-l-[3px] border-site-primary bg-site-surface p-7">
            <h2 className="font-serif text-xl font-medium text-site-ink">{t.ux.memberPromo.title}</h2>
            <p className="mt-2 text-sm text-site-muted">{t.ux.memberPromo.body}</p>
            <ButtonLink
              href="/membre/inscription"
              size="sm"
              className="mt-4"
              data-cta="cta_adhesion"
            >
              {t.ux.memberPromo.cta}
            </ButtonLink>
          </div>
        </ScrollReveal>
      </div>
    </>
  );
}
