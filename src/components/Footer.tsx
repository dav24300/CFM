import Link from "next/link";
import Image from "next/image";
import { Facebook, Youtube, Linkedin, Shield } from "lucide-react";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SITE } from "@/lib/constants";
import { getDictionary, type Locale } from "@/lib/i18n";
import { getI18nOverridesForLocale, applyI18nOverrides } from "@/lib/i18n-overrides.server";
import { getSiteConfig, getSocialLinks, getPartners } from "@/lib/site-config.server";
import { resolveMediaPath } from "@/lib/media.server";
import type { SiteConfig } from "@/domain/site-config";

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type Props = { locale: Locale };

export async function Footer({ locale }: Props) {
  const base = getDictionary(locale);
  const overrides = await getI18nOverridesForLocale(locale);
  const t = applyI18nOverrides(base, overrides);
  const f = t.footer;
  const site: SiteConfig = await getSiteConfig();
  const social = await getSocialLinks();
  const partners = await getPartners();

  const isEn = locale === "en";

  const socialItems = [
    { href: social.facebook, label: "Facebook", Icon: Facebook },
    { href: social.twitter, label: "X (Twitter)", Icon: XIcon },
    { href: social.youtube, label: "YouTube", Icon: Youtube },
    { href: social.linkedin, label: "LinkedIn", Icon: Linkedin },
  ].filter((item) => item.href);

  const heading =
    "text-xs font-bold uppercase tracking-[0.1em] text-white";
  const linkCls = "text-white/70 transition hover:text-white";

  return (
    <footer className="bg-site-deep pt-[76px] text-white/70" id="footer">
      <div className="mx-auto max-w-site px-6">
        <div className="grid gap-11 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr]">
          {/* Marque */}
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 flex-none items-center justify-center bg-site-primary text-white">
                <Shield className="h-5 w-5" aria-hidden />
              </span>
              <span className="font-serif text-xl font-semibold text-white">
                {site.sigle} ASBL
              </span>
            </div>
            <p className="mt-[18px] max-w-[36ch] text-[14.5px] leading-[1.65]">
              {f.tagline || site.tagline}
            </p>
            <p className="mt-4 text-sm leading-[1.7]">
              <a href={`mailto:${site.email}`} className="text-site-light hover:underline">
                {site.email}
              </a>
              <br />
              <span className="text-white/55">Kinshasa, {site.country}</span>
            </p>
            <div className="mt-5 flex gap-2.5">
              {socialItems.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center border border-white/20 text-white transition hover:border-site-primary hover:bg-site-primary"
                >
                  <Icon className="h-[17px] w-[17px]" />
                </a>
              ))}
            </div>
          </div>

          {/* Naviguer */}
          <div>
            <h4 className={heading}>{f.actNow}</h4>
            <ul className="mt-[18px] flex flex-col gap-[11px] text-[14.5px]">
              <li>
                <Link href="/" className={linkCls}>
                  {isEn ? "Home" : "Accueil"}
                </Link>
              </li>
              <li>
                <Link href="/axes" className={linkCls}>
                  {f.axes}
                </Link>
              </li>
              <li>
                <Link href="/actions" className={linkCls}>
                  Actions
                </Link>
              </li>
              <li>
                <Link href="/plaidoyer" className={linkCls}>
                  {f.advocacy}
                </Link>
              </li>
              <li>
                <Link href="/live" className={linkCls} data-cta="cta_live">
                  {f.live}
                </Link>
              </li>
            </ul>
          </div>

          {/* Découvrir */}
          <div>
            <h4 className={heading}>{f.quickLinks}</h4>
            <ul className="mt-[18px] flex flex-col gap-[11px] text-[14.5px]">
              <li>
                <Link href="/a-propos" className={linkCls}>
                  {f.about}
                </Link>
              </li>
              <li>
                <Link href="/s-engager" className={linkCls}>
                  {f.engage}
                </Link>
              </li>
              <li>
                <Link href="/petitions" className={linkCls} data-cta="cta_petition">
                  {f.petitions}
                </Link>
              </li>
              <li>
                <Link href="/presse" className={linkCls}>
                  {f.press}
                </Link>
              </li>
            </ul>
          </div>

          {/* Aide & compte */}
          <div>
            <h4 className={heading}>{f.contact}</h4>
            <ul className="mt-[18px] flex flex-col gap-[11px] text-[14.5px]">
              <li>
                <Link href="/contact#aide" className={linkCls} data-cta="cta_aide">
                  {isEn ? "Contact & help" : "Contact & aide"}
                </Link>
              </li>
              <li>
                <Link href="/s-engager#don" className={linkCls} data-cta="cta_don">
                  {f.donate}
                </Link>
              </li>
              <li>
                <Link href="/membre/connexion" className={linkCls}>
                  {isEn ? "Member area" : "Espace membre"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className={heading}>{f.newsletter}</h4>
            <p className="mt-[18px] text-sm leading-[1.6] text-white/70">{f.newsletterDesc}</p>
            <NewsletterForm variant="footer" />
          </div>
        </div>

        {partners.length > 0 && (
          <div className="mt-12 border-t border-white/12 pt-8">
            <h4 className="text-center text-xs font-bold uppercase tracking-[0.1em] text-white/60">
              {locale === "en" ? "Our partners" : "Nos partenaires"}
            </h4>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
              {partners.map((partner) => {
                const logo = partner.logo_url ? resolveMediaPath(partner.logo_url) : null;
                const inner = logo ? (
                  <Image
                    src={logo}
                    alt={partner.name}
                    width={120}
                    height={48}
                    className="h-12 w-auto max-w-[120px] object-contain opacity-80 transition hover:opacity-100"
                  />
                ) : (
                  <span className="text-sm text-white/70">{partner.name}</span>
                );
                return partner.website ? (
                  <a key={partner.id} href={partner.website} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <div key={partner.id}>{inner}</div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-wrap justify-between gap-3.5 border-t border-white/12 py-6 text-[13px] text-white/50">
          <span>
            © {new Date().getFullYear()} {site.name} — {f.copyright} · {isEn ? "Founded" : "Fondée"} en{" "}
            {SITE.founded}
          </span>
          <span className="flex flex-wrap gap-[18px]">
            <Link href="/mentions-legales" className="text-white/50 hover:text-white">
              {f.legal}
            </Link>
            <Link href="/confidentialite" className="text-white/50 hover:text-white">
              {f.privacyPolicy}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
