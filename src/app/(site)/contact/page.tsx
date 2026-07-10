import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Phone, MapPin, Shield } from "lucide-react";
import { HelpRequestForm } from "@/components/HelpRequestForm";
import { ContactForm } from "@/components/ContactForm";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { Alert } from "@/components/ui/primitives/alert";
import { getTranslations } from "@/lib/i18n-server";
import { getSiteConfig } from "@/lib/site-config.server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.pages.contact.title };
}

type Props = { searchParams: Promise<{ type?: string }> };

export default async function ContactPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const { locale, t } = await getTranslations();
  const site = await getSiteConfig();
  const c = t.pages.contact;
  const h = t.ux.helpInfo;
  const contactType = type === "partenariat" ? "partenariat" : "contact";

  const infoCards = [
    { Icon: Mail, title: c.email, value: site.email, href: `mailto:${site.email}` },
    { Icon: Phone, title: c.phone, value: site.phone },
    { Icon: MapPin, title: c.country, value: site.country },
  ];

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: locale === "en" ? "Home" : "Accueil", href: "/" }, { label: c.title }]}
        kicker={locale === "en" ? "Contact & help" : "Contact & aide"}
        title={c.title}
        subtitle={c.subtitle}
      />

      <div className="mx-auto max-w-site px-6 py-20">
        <div className="grid gap-5 md:grid-cols-3">
          {infoCards.map(({ Icon, title, value, href }) => (
            <div key={title} className="flex items-start gap-3 border border-site-hairline bg-white p-6">
              <Icon className="h-6 w-6 shrink-0 text-site-primary" aria-hidden />
              <div>
                <h3 className="font-semibold text-site-ink">{title}</h3>
                {href ? (
                  <a href={href} className="text-sm text-site-muted hover:text-site-primary">
                    {value}
                  </a>
                ) : (
                  <p className="text-sm text-site-muted">{value}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <section id="aide" className="scroll-mt-24">
            <h2 className="font-serif text-2xl font-medium text-site-ink">{c.helpTitle}</h2>
            <p className="mt-2 text-sm text-site-muted">{c.helpSubtitle}</p>
            <Alert variant="info" className="mt-4 flex items-start gap-3">
              <Shield className="h-5 w-5 shrink-0 text-site-primary" aria-hidden />
              <div className="space-y-2 text-sm">
                <p className="font-semibold">{h.title}</p>
                <p>{h.confidentiality}</p>
                <p>{h.delay}</p>
                <p>
                  {h.memberFollowUp}{" "}
                  <Link href="/membre/inscription" className="font-semibold text-site-primary hover:underline">
                    {t.common.createAccountBtn}
                  </Link>
                </p>
              </div>
            </Alert>
            <div className="mt-6 border border-site-hairline bg-white p-7">
              <HelpRequestForm />
            </div>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-medium text-site-ink">{c.generalTitle}</h2>
            <p className="mt-2 text-sm text-site-muted">{c.generalSubtitle}</p>
            <div className="mt-6 border border-site-hairline bg-white p-7">
              <ContactForm defaultType={contactType} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
