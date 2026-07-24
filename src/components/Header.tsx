"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ButtonLink } from "@/components/ui/patterns/button-link";
import { Menu, X, Shield, User, ChevronDown } from "lucide-react";
import { AXES } from "@/lib/constants";
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
  site: SiteConfig;
  nav: NavLabels;
  memberLogin: string;
  memberArea: string;
};

export function Header({ site, nav, memberLogin, memberArea }: Props) {
  const [open, setOpen] = useState(false);
  const [axesOpen, setAxesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Le layout du site public est statique et ne lit plus la session : l'état de
  // connexion est déterminé ici, côté client.
  //
  // L'état initial est `false` — comme le HTML prérendu — pour ne PAS provoquer
  // de divergence d'hydratation. La correction se fait dans l'effet (après
  // hydratation) : un visiteur ANONYME (pas de cookie-indice) ne fait aucune
  // requête et reste sur l'état déconnecté ; un membre bascule via l'indice
  // (instantané), confirmé par /api/member/me.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const hint = document.cookie.split("; ").some((c) => c === "cfm_member_hint=1");
    // Aucun indice : visiteur anonyme (l'immense majorité du trafic public).
    // On évite l'appel réseau et on reste déconnecté.
    if (!hint) return;

    // Affichage optimiste immédiat, puis confirmation faisant autorité —
    // l'indice peut être périmé (session expirée, compte suspendu). Endpoint
    // léger : un booléen, sans PII ni scan de table.
    setIsAuthenticated(true);
    let cancelled = false;
    fetch("/api/member/status", { credentials: "same-origin" })
      .then(async (res) => {
        if (cancelled) return;
        // Une panne serveur (5xx) ne doit pas « déconnecter » visuellement un
        // membre : seule une réponse exploitable fait autorité, sinon on
        // conserve l'état donné par l'indice.
        if (!res.ok) return;
        const data = await res.json().catch(() => null);
        if (!cancelled && data) setIsAuthenticated(Boolean(data.authenticated));
      })
      .catch(() => {
        /* hors ligne : on garde la valeur de l'indice */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          <Link
            href={isAuthenticated ? "/membre" : "/membre/connexion"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-site-muted transition hover:text-site-primary"
            aria-label={isAuthenticated ? memberArea : memberLogin}
          >
            <User className="h-4 w-4" aria-hidden />
            <span className="hidden xl:inline">{isAuthenticated ? memberArea : nav.member}</span>
          </Link>
          <ButtonLink
            href="/contact#aide"
            className="px-[18px] py-[11px] text-sm"
            data-cta="cta_aide"
          >
            {nav.help}
          </ButtonLink>
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
            <MobileLink
              href={isAuthenticated ? "/membre" : "/membre/connexion"}
              onClick={() => setOpen(false)}
            >
              {isAuthenticated ? memberArea : nav.member}
            </MobileLink>
            <ButtonLink
              href="/contact#aide"
              className="mt-2 w-full py-3.5 text-[15px]"
              onClick={() => setOpen(false)}
              data-cta="cta_aide"
            >
              {nav.help}
            </ButtonLink>
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
