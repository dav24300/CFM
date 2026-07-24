import type { Metadata } from "next";
import { Heart, Users, HandHeart } from "lucide-react";
import { AnchorButton } from "@/components/ui/patterns/button-link";
import { DonationForm } from "@/components/DonationForm";
import { MembershipForm } from "@/components/MembershipForm";
import { DonationTransparency } from "@/components/DonationTransparency";
import { MembershipComparisonTable } from "@/components/ux/MembershipComparisonTable";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { getTranslationsFor } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsFor("fr");
  return { title: t.pages.engage.title };
}

const typeIcons = { famille: Users, soutien: Heart, benevole: HandHeart };
const typeIds = ["famille", "soutien", "benevole"] as const;

export default async function EngagerPage() {
  const { locale, t } = await getTranslationsFor("fr");
  const e = t.pages.engage;
  const x = t.pages.engageExtra;

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: locale === "en" ? "Home" : "Accueil", href: "/" }, { label: e.title }]}
        kicker={locale === "en" ? "Get involved" : "S’engager"}
        title={e.title}
        subtitle={e.subtitle}
      />

      <div className="mx-auto max-w-site px-6 py-20">
        {/* Types d'adhésion */}
        <section>
          <h2 className="font-serif text-2xl font-medium text-site-ink">{e.typesTitle}</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {typeIds.map((id) => {
              const Icon = typeIcons[id];
              const type = t.membershipTypes[id];
              return (
                <div key={id} className="border border-site-hairline bg-white p-7 text-center">
                  <div className="mx-auto inline-flex bg-site-pale p-4 text-site-primary">
                    <Icon className="h-8 w-8" aria-hidden />
                  </div>
                  <h3 className="mt-4 font-serif text-xl font-medium text-site-ink">{type.label}</h3>
                  <p className="mt-2 text-sm text-site-muted-2">{type.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Compte membre */}
        <section className="mt-12 scroll-mt-24 border-l-[3px] border-site-primary bg-site-surface p-7">
          <h2 className="font-serif text-2xl font-medium text-site-ink">{e.memberTitle}</h2>
          <p className="mt-2 text-site-muted">{e.memberSubtitle}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <AnchorButton href="/membre/inscription" size="sm" data-cta="cta_adhesion">
              {x.createAccount}
            </AnchorButton>
            <AnchorButton href="/membre/connexion" variant="secondary" size="sm">
              {x.signIn}
            </AnchorButton>
          </div>
        </section>

        <div className="mt-12">
          <MembershipComparisonTable labels={t.ux.membershipCompare} />
        </div>

        {/* Adhésion rapide */}
        <section className="mt-16 scroll-mt-24" id="adhesion">
          <h2 className="font-serif text-2xl font-medium text-site-ink">{x.quickSignupTitle}</h2>
          <p className="mt-2 text-site-muted">{x.quickSignupDesc}</p>
          <div className="mt-6 max-w-2xl border border-site-hairline bg-white p-7">
            <MembershipForm />
          </div>
        </section>

        {/* Don */}
        <section className="mt-16 scroll-mt-24" id="don">
          <div className="border border-site-hairline bg-white p-7">
            <h2 className="font-serif text-2xl font-medium text-site-ink">{e.donateTitle}</h2>
            <p className="mt-2 text-site-muted">{e.donateSubtitle}</p>
            <div className="mt-6 max-w-lg">
              <DonationForm />
            </div>
          </div>
        </section>

        {/* Transparence */}
        <section className="mt-16 scroll-mt-24" id="transparence">
          <h2 className="font-serif text-2xl font-medium text-site-ink">{x.transparencyTitle}</h2>
          <p className="mt-4 max-w-3xl text-site-muted">{x.transparencyBody}</p>
          <div className="mt-6 border-l-[3px] border-site-primary bg-site-surface p-7">
            <h3 className="font-serif text-lg font-medium text-site-ink">
              {t.ux.transparency.impactTitle}
            </h3>
            <p className="mt-2 text-sm text-site-muted">{t.ux.transparency.impactBody}</p>
            <h3 className="mt-6 font-semibold text-site-ink">{x.fundsTitle}</h3>
            <ul className="mt-4 space-y-2 text-site-muted">
              {[x.fund1, x.fund2, x.fund3, x.fund4].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 bg-site-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-site-muted-2">{x.annualReport}</p>
            <DonationTransparency />
          </div>
        </section>

        {/* Partenariat */}
        <section className="mt-16 scroll-mt-24" id="partenaire">
          <h2 className="font-serif text-2xl font-medium text-site-ink">{x.partnerTitle}</h2>
          <p className="mt-4 text-site-muted">{x.partnerBody}</p>
          <AnchorButton href="/contact?type=partenariat" className="mt-4">
            {x.partnerBtn}
          </AnchorButton>
        </section>
      </div>
    </>
  );
}
