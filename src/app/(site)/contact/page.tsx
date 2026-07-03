import type { Metadata } from "next";
import { HelpRequestForm } from "@/components/HelpRequestForm";
import { ContactForm } from "@/components/ContactForm";
import { SITE } from "@/lib/constants";
import { Mail, Phone, MapPin } from "lucide-react";
import { getTranslations } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.pages.contact.title };
}

export default async function ContactPage() {
  const { t } = await getTranslations();
  const c = t.pages.contact;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="section-title">{c.title}</h1>
      <p className="section-subtitle max-w-3xl">{c.subtitle}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        <div className="card flex items-start gap-3">
          <Mail className="h-6 w-6 text-cfm-gold shrink-0" aria-hidden />
          <div>
            <h3 className="font-semibold">{c.email}</h3>
            <a href={`mailto:${SITE.email}`} className="text-sm text-cfm-earth hover:text-cfm-gold">
              {SITE.email}
            </a>
          </div>
        </div>
        <div className="card flex items-start gap-3">
          <Phone className="h-6 w-6 text-cfm-gold shrink-0" aria-hidden />
          <div>
            <h3 className="font-semibold">{c.phone}</h3>
            <p className="text-sm text-cfm-earth">{SITE.phone}</p>
          </div>
        </div>
        <div className="card flex items-start gap-3">
          <MapPin className="h-6 w-6 text-cfm-gold shrink-0" aria-hidden />
          <div>
            <h3 className="font-semibold">{c.country}</h3>
            <p className="text-sm text-cfm-earth">{SITE.country}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-2">
        <section id="aide" className="scroll-mt-24">
          <h2 className="font-display text-2xl font-bold text-cfm-navy">{c.helpTitle}</h2>
          <p className="mt-2 text-sm text-cfm-earth">{c.helpSubtitle}</p>
          <div className="mt-6 card">
            <HelpRequestForm />
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-cfm-navy">{c.generalTitle}</h2>
          <p className="mt-2 text-sm text-cfm-earth">{c.generalSubtitle}</p>
          <div className="mt-6 card">
            <ContactForm />
          </div>
        </section>
      </div>
    </div>
  );
}
