import type { Metadata } from "next";
import { getTranslationsFor } from "@/lib/i18n-server";
import { getSiteConfig, getLegalContent } from "@/lib/site-config.server";
import { SimpleMarkdown } from "@/components/ui/SimpleMarkdown";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsFor("fr");
  return { title: t.pages.legal.mentionsTitle };
}

export default async function MentionsLegalesPage() {
  const locale = "fr";
  const { t } = await getTranslationsFor("fr");
  const site = await getSiteConfig();
  const cms = await getLegalContent("legal_mentions", locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 prose prose-cfm">
      <h1 className="section-title">{t.pages.legal.mentionsTitle}</h1>

      {cms ? (
        <div className="mt-8">
          <SimpleMarkdown content={cms} />
        </div>
      ) : (
        <section className="mt-8 space-y-4 text-site-muted">
          <h2 className="font-serif text-xl font-bold text-site-ink">Éditeur du site</h2>
          <p>
            <strong>{site.name}</strong> ({site.sigle})<br />
            Association sans but lucratif (ASBL)<br />
            {site.country}<br />
            Email : {site.email}
          </p>
          <h2 className="font-serif text-xl font-bold text-site-ink mt-8">Directeur de publication</h2>
          <p>{site.founder}, fondateur de {site.sigle}</p>
        </section>
      )}
    </div>
  );
}
