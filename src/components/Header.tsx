"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Shield, User } from "lucide-react";
import { SITE } from "@/lib/constants";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ButtonLink } from "@/components/ui/patterns/button-link";
import { getDictionary, type Locale } from "@/lib/i18n";

type Props = { locale: Locale };

export function Header({ locale }: Props) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const t = getDictionary(locale);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 80);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "/", label: t.nav.home },
    { href: "/a-propos", label: t.nav.about },
    { href: "/axes", label: t.nav.axes },
    { href: "/plaidoyer", label: t.nav.advocacy },
    { href: "/actions", label: t.nav.actions },
    { href: "/petitions", label: t.nav.petitions },
    { href: "/live", label: t.nav.live },
    { href: "/s-engager", label: t.nav.engage },
    { href: "/presse", label: t.nav.press },
    { href: "/contact", label: t.nav.contact },
  ];

  return (
    <header
      className={`sticky top-0 z-50 border-b border-cfm-gold/20 bg-white/95 backdrop-blur transition-all duration-300 ${
        scrolled ? "py-2 shadow-cfm" : "py-4"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div
            className={`flex items-center justify-center rounded-full bg-cfm-navy text-cfm-gold transition-all duration-300 ${
              scrolled ? "h-9 w-9" : "h-11 w-11"
            }`}
          >
            <Shield className={scrolled ? "h-5 w-5" : "h-6 w-6"} aria-hidden />
          </div>
          <div>
            <span className="font-display text-lg font-bold text-cfm-navy">{SITE.sigle}</span>
            <p className={`hidden text-xs text-cfm-earth sm:block ${scrolled ? "sr-only" : ""}`}>
              {SITE.name}
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 xl:flex" aria-label="Navigation principale">
          {navItems.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-cfm-navy transition hover:text-cfm-gold"
            >
              {link.label}
            </Link>
          ))}
          <LocaleSwitcher current={locale} />
          <Link
            href="/membre/connexion"
            className="flex items-center gap-1 text-sm font-medium text-cfm-navy hover:text-cfm-gold"
          >
            <User className="h-4 w-4" />
            {t.member.login}
          </Link>
          <ButtonLink href="/contact#aide" size="sm">
            {t.nav.help}
          </ButtonLink>
        </nav>

        <button
          type="button"
          className="rounded-lg p-2 text-cfm-navy xl:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Fermer" : "Menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-gray-100 bg-white px-4 py-4 xl:hidden">
          <div className="flex flex-col gap-3">
            {navItems.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 font-medium text-cfm-navy hover:bg-cfm-cream"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/membre/connexion" className="rounded-lg px-3 py-2 font-medium text-cfm-navy hover:bg-cfm-cream">
              {t.nav.member}
            </Link>
            <LocaleSwitcher current={locale} />
            <ButtonLink href="/contact#aide" className="text-center" onClick={() => setOpen(false)}>
              {t.nav.help}
            </ButtonLink>
          </div>
        </nav>
      )}
    </header>
  );
}
