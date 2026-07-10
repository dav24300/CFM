"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Menu, X, Shield, User, ChevronDown } from "lucide-react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { AXES } from "@/lib/constants";
import type { Locale } from "@/lib/i18n";
import type { SiteConfig } from "@/domain/site-config";

type NavLabels = {
  home: string;
  about: string;
  axes: string;
  advocacy: string;
  actions: string;
  petitions: string;
  live: string;
  engage: string;
  press: string;
  contact: string;
  member: string;
  help: string;
};

type Props = {
  locale: Locale;
  site: SiteConfig;
  nav: NavLabels;
  memberLogin: string;
};

export function Header({ locale, site, nav, memberLogin }: Props) {
  const [open, setOpen] = useState(false);
  const [axesOpen, setAxesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 30);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Verrouille le défilement quand le tiroir mobile est ouvert.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navLink =
    "text-sm font-medium text-site-muted transition hover:text-site-primary";

  return (
    <header
      className={`sticky top-0 z-50 border-b border-site-hairline bg-white/95 backdrop-blur transition-shadow duration-300 ${
        scrolled ? "shadow-site-hover" : ""
      }`}
    >
      <div className="mx-auto flex max-w-site items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center bg-site-primary text-white">
            <Shield className="h-[18px] w-[18px]" aria-hidden />
          </span>
          <span className="font-serif text-lg font-semibold tracking-[0.02em] text-site-ink">
            <span className="hidden sm:inline">{site.name}</span>
            <span className="sm:hidden">{site.sigle}</span>
          </span>
        </Link>

        {/* Nav bureau ≥ lg */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Navigation principale">
          <Link href="/" className={navLink}>
            {nav.home}
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setAxesOpen(true)}
            onMouseLeave={() => setAxesOpen(false)}
          >
            <Link
              href="/axes"
              className={`inline-flex items-center gap-1.5 ${navLink}`}
              aria-haspopup="true"
              aria-expanded={axesOpen}
            >
              {nav.axes}
              <ChevronDown className="h-3 w-3" aria-hidden />
            </Link>
            {axesOpen && (
              <div className="absolute -left-4 top-[calc(100%+12px)] w-60 border border-site-hairline bg-white p-2 shadow-site-hover">
                {AXES.map((axe) => (
                  <Link
                    key={axe.slug}
                    href={`/axes/${axe.slug}`}
                    className="block px-3.5 py-2.5 text-sm font-medium text-site-ink transition hover:bg-site-surface"
                  >
                    {axe.title}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link href="/actions" className={navLink}>
            {nav.actions}
          </Link>
          <Link href="/plaidoyer" className={navLink}>
            {nav.advocacy}
          </Link>
          <Link
            href="/live"
            className={`inline-flex items-center gap-2 ${navLink}`}
            data-cta="cta_live"
          >
            <span className="h-[7px] w-[7px] animate-live-pulse bg-site-live" aria-hidden />
            {nav.live}
          </Link>
          <Link href="/s-engager" className={navLink}>
            {nav.engage}
          </Link>
          <Link href="/a-propos" className={navLink}>
            {nav.about}
          </Link>

          <span className="mx-1 h-5 w-px bg-site-hairline" aria-hidden />
          <LocaleSwitcher current={locale} />
          <Link
            href="/membre/connexion"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-site-muted transition hover:text-site-primary"
            aria-label={memberLogin}
          >
            <User className="h-4 w-4" aria-hidden />
            <span className="hidden xl:inline">{nav.member}</span>
          </Link>
          <Link
            href="/contact#aide"
            className="bg-site-primary px-[18px] py-[11px] text-sm font-semibold text-white transition hover:bg-site-primary-dark"
            data-cta="cta_aide"
          >
            {nav.help}
          </Link>
        </nav>

        <button
          type="button"
          className="p-1.5 text-site-ink lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Tiroir mobile < lg */}
      {open && (
        <nav className="border-t border-site-hairline bg-white px-6 pb-5 pt-2.5 lg:hidden">
          <div className="flex flex-col">
            <MobileLink href="/" onClick={() => setOpen(false)}>
              {nav.home}
            </MobileLink>
            <MobileLink href="/axes" onClick={() => setOpen(false)}>
              {nav.axes}
            </MobileLink>
            <div className="flex flex-col gap-0.5 py-1 pl-[18px] pr-1.5">
              {AXES.map((axe) => (
                <Link
                  key={axe.slug}
                  href={`/axes/${axe.slug}`}
                  className="py-2 text-sm font-medium text-site-muted"
                  onClick={() => setOpen(false)}
                >
                  — {axe.title}
                </Link>
              ))}
            </div>
            <MobileLink href="/actions" onClick={() => setOpen(false)}>
              {nav.actions}
            </MobileLink>
            <MobileLink href="/plaidoyer" onClick={() => setOpen(false)}>
              {nav.advocacy}
            </MobileLink>
            <MobileLink href="/petitions" onClick={() => setOpen(false)}>
              {nav.petitions}
            </MobileLink>
            <MobileLink href="/live" onClick={() => setOpen(false)}>
              {nav.live}
            </MobileLink>
            <MobileLink href="/s-engager" onClick={() => setOpen(false)}>
              {nav.engage}
            </MobileLink>
            <MobileLink href="/presse" onClick={() => setOpen(false)}>
              {nav.press}
            </MobileLink>
            <MobileLink href="/a-propos" onClick={() => setOpen(false)}>
              {nav.about}
            </MobileLink>
            <MobileLink href="/membre/connexion" onClick={() => setOpen(false)}>
              {nav.member}
            </MobileLink>
            <div className="mt-3 flex items-center justify-between">
              <LocaleSwitcher current={locale} />
            </div>
            <Link
              href="/contact#aide"
              className="mt-2 bg-site-primary py-3.5 text-center text-[15px] font-semibold text-white"
              onClick={() => setOpen(false)}
              data-cta="cta_aide"
            >
              {nav.help}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

function MobileLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-1.5 py-3 text-[15px] font-semibold text-site-ink"
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
