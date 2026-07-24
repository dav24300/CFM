import type { Metadata } from "next";
import { getTranslationsFor } from "@/lib/i18n-server";
import { getSiteConfig, getLegalContent } from "@/lib/site-config.server";
import { SimpleMarkdown } from "@/components/ui/SimpleMarkdown";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsFor("fr");
  return { title: t.pages.legal.privacyTitle };
}

export default async function ConfidentialitePage() {
  const locale = "fr";
  const { t } = await getTranslationsFor("fr");
  const l = t.pages.legal;
  const site = await getSiteConfig();
  const cms = await getLegalContent("legal_privacy", locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="section-title">{l.privacyTitle}</h1>
      <p className="section-subtitle">
        {l.privacySubtitle} — {site.sigle}
      </p>

      {cms ? (
        <div className="mt-8">
          <SimpleMarkdown content={cms} />
        </div>
      ) : (
        <div className="mt-8 space-y-6 text-site-muted leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-bold text-site-ink">1. Responsable du traitement</h2>
            <p className="mt-2">
              {site.name} ({site.sigle}), ASBL basée en {site.country}, est responsable du traitement
              des données collectées via ce site.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-xl font-bold text-site-ink">2. Données collectées</h2>
            <p className="mt-2">Nous collectons les données suivantes selon les formulaires utilisés :</p>
            <ul className="mt-2 list-disc pl-6 space-y-1">
              <li>Identité (nom, prénom)</li>
              <li>Coordonnées (email, téléphone, province)</li>
              <li>Informations sur le lien familial militaire (adhésion famille uniquement)</li>
              <li>Demandes d&apos;aide confidentielles (statut, besoins, description)</li>
              <li>Données relatives aux mineurs (âge, consentement parental)</li>
            </ul>
          </section>
          <section>
            <h2 className="font-serif text-xl font-bold text-site-ink">7. Vos droits</h2>
            <p className="mt-2">
              Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos
              données. Contactez-nous à {site.email}.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
