import Link from "next/link";
import { Facebook, Youtube, Linkedin, Mail, Phone } from "lucide-react";
import { SITE } from "@/lib/constants";
import { NewsletterForm } from "@/components/NewsletterForm";
import { getDictionary, type Locale } from "@/lib/i18n";

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type Props = { locale: Locale };

export function Footer({ locale }: Props) {
  const t = getDictionary(locale);
  const f = t.footer;

  return (
    <footer className="bg-cfm-navy text-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-display text-xl font-bold text-cfm-gold">
              {SITE.sigle}
            </h3>
            <p className="mt-2 text-sm text-gray-300">{f.tagline}</p>
            <p className="mt-4 text-sm italic text-gray-400">
              &laquo; {f.quote} &raquo;
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-cfm-gold">{f.quickLinks}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/a-propos" className="hover:text-cfm-gold">
                  {f.about}
                </Link>
              </li>
              <li>
                <Link href="/plaidoyer" className="hover:text-cfm-gold">
                  {f.advocacy}
                </Link>
              </li>
              <li>
                <Link href="/s-engager" className="hover:text-cfm-gold">
                  {f.engage}
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="hover:text-cfm-gold">
                  {f.privacy}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-cfm-gold">{f.contact}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-cfm-gold" aria-hidden />
                <a href={`mailto:${SITE.email}`} className="hover:text-cfm-gold">
                  {SITE.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-cfm-gold" aria-hidden />
                <span>{SITE.phone}</span>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a
                href="https://facebook.com/cfmasbl"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 hover:bg-cfm-gold hover:text-cfm-navy"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="https://x.com/cfmasbl"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 hover:bg-cfm-gold hover:text-cfm-navy"
                aria-label="X (Twitter)"
              >
                <XIcon className="h-5 w-5" />
              </a>
              <a
                href="https://youtube.com/@cfmasbl"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 hover:bg-cfm-gold hover:text-cfm-navy"
                aria-label="YouTube"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/company/cfmasbl"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-white/10 p-2 hover:bg-cfm-gold hover:text-cfm-navy"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-cfm-gold">{f.newsletter}</h4>
            <p className="mt-2 text-sm text-gray-300">{f.newsletterDesc}</p>
            <NewsletterForm variant="footer" />
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-sm text-gray-400">
          <p>
            © {new Date().getFullYear()} {SITE.name} — {f.copyright}, {SITE.country}
          </p>
          <p className="mt-1">
            <Link href="/mentions-legales" className="hover:text-cfm-gold">
              {f.legal}
            </Link>
            {" · "}
            <Link href="/confidentialite" className="hover:text-cfm-gold">
              {f.privacyPolicy}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
