import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { getTranslations } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.pages.legal.mentionsTitle };
}

export default async function MentionsLegalesPage() {
  const { t } = await getTranslations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-cfm">
      <h1 className="section-title">{t.pages.legal.mentionsTitle}</h1>

      <section className="mt-8 space-y-4 text-cfm-earth">
        <h2 className="font-display text-xl font-bold text-cfm-navy">Éditeur du site</h2>
        <p>
          <strong>{SITE.name}</strong> ({SITE.sigle})<br />
          Association sans but lucratif (ASBL)<br />
          {SITE.country}<br />
          Email : {SITE.email}
        </p>

        <h2 className="font-display text-xl font-bold text-cfm-navy mt-8">Directeur de publication</h2>
        <p>{SITE.founder}, fondateur de {SITE.sigle}</p>

        <h2 className="font-display text-xl font-bold text-cfm-navy mt-8">Hébergement</h2>
        <p>
          Le site est hébergé par un prestataire conforme aux exigences de disponibilité pour
          la RDC. Les informations d&apos;hébergement seront complétées lors du déploiement en production.
        </p>

        <h2 className="font-display text-xl font-bold text-cfm-navy mt-8">Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble du contenu de ce site (textes, images, logos) est la propriété de {SITE.sigle}
          ou de ses partenaires. Toute reproduction est soumise à autorisation préalable.
        </p>

        <h2 className="font-display text-xl font-bold text-cfm-navy mt-8">Limitation de responsabilité</h2>
        <p>
          {SITE.sigle} s&apos;efforce d&apos;assurer l&apos;exactitude des informations publiées.
          Toutefois, l&apos;association ne saurait être tenue responsable des erreurs ou omissions.
        </p>
      </section>
    </div>
  );
}
