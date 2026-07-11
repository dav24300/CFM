"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

type Crumb = { label: string; href?: string };

type Props = {
  breadcrumb?: Crumb[];
  kicker?: string;
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  /** Contenu de badge (icône + libellé), affiché au-dessus du titre. */
  badge?: ReactNode;
  /** Boutons d'appel à l'action sous le sous-titre. */
  ctas?: ReactNode;
  /** Affiche la frise dégradée animée (pages index). */
  showBar?: boolean;
  minHeight?: string;
};

/**
 * En-tête intérieur sombre avec parallaxe curseur + ken-burns (cf. Axes/Axe-*.dc.html).
 * Réutilisé par les pages du site public. Réduit le mouvement si prefers-reduced-motion.
 */
export function InteriorHero({
  breadcrumb,
  kicker,
  title,
  subtitle,
  image,
  imageAlt,
  badge,
  ctas,
  showBar,
  minHeight = "440px",
}: Props) {
  const reduced = useReducedMotion();
  const scopeRef = useRef<HTMLElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const scope = scopeRef.current;
    if (!scope) return;
    const layers: Array<[HTMLElement | null, number]> = [
      [baseRef.current, 0.05],
      [gridRef.current, 0.09],
      [contentRef.current, -0.03],
    ];
    let tx = 0;
    let ty = 0;
    function onMove(ev: MouseEvent) {
      const r = scope!.getBoundingClientRect();
      tx = (ev.clientX - r.left) / r.width - 0.5;
      ty = (ev.clientY - r.top) / r.height - 0.5;
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        layers.forEach(([l, d]) => {
          if (l) l.style.transform = `translate(${(-tx * d * 140).toFixed(1)}px, ${(-ty * d * 140).toFixed(1)}px)`;
        });
      });
    }
    function onLeave() {
      layers.forEach(([l]) => {
        if (!l) return;
        l.style.transition = "transform .5s ease";
        l.style.transform = "translate(0,0)";
        window.setTimeout(() => {
          l.style.transition = "";
        }, 500);
      });
    }
    scope.addEventListener("mousemove", onMove);
    scope.addEventListener("mouseleave", onLeave);
    return () => {
      scope.removeEventListener("mousemove", onMove);
      scope.removeEventListener("mouseleave", onLeave);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduced]);

  const reveal = (delay: number): React.CSSProperties =>
    reduced ? {} : { animation: `fu .9s ${delay}s both` };

  return (
    <section
      ref={scopeRef}
      className="relative flex items-end overflow-hidden bg-site-hero-dark"
      style={{ minHeight }}
    >
      {/* Couche média + ken-burns */}
      <div ref={baseRef} className="absolute inset-[-30px]">
        <div
          className="absolute inset-0 origin-[60%_40%]"
          style={reduced ? undefined : { animation: "kb 18s ease-in-out infinite alternate" }}
        >
          {image ? (
            <Image src={image} alt={imageAlt || ""} fill priority className="object-cover" sizes="100vw" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-linear-gradient(135deg,#232830 0,#232830 13px,#30363f 13px,#30363f 26px)",
              }}
            />
          )}
        </div>
      </div>

      {/* Grille technique */}
      <div
        ref={gridRef}
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(120,160,240,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(120,160,240,.10) 1px,transparent 1px)",
          backgroundSize: "52px 52px",
        }}
        aria-hidden
      />
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg,rgba(10,18,36,.78),rgba(15,17,20,.42) 60%,rgba(15,17,20,.88))",
        }}
        aria-hidden
      />

      <div ref={contentRef} className="relative mx-auto w-full max-w-site px-6 pb-14">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-[18px] text-[13px] font-medium text-white/60" aria-label="Fil d'Ariane">
            {breadcrumb.map((c, i) => (
              <span key={c.label}>
                {c.href ? (
                  <Link href={c.href} className="text-white/60 hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white">{c.label}</span>
                )}
                {i < breadcrumb.length - 1 && <span className="px-1.5 opacity-50">/</span>}
              </span>
            ))}
          </nav>
        )}

        {showBar && (
          <div
            className="mb-[22px] h-[3px] w-16 origin-left"
            style={{
              background: "linear-gradient(90deg,#14418a,#7aa7f5,#14418a)",
              backgroundSize: "200% 100%",
              ...(reduced ? {} : { animation: "grow .9s .1s both, shim 3s 1s linear infinite" }),
            }}
            aria-hidden
          />
        )}

        {badge && (
          <div className="mb-[18px]" style={reveal(0.15)}>
            {badge}
          </div>
        )}

        {kicker && (
          <p
            className="mb-3.5 text-xs font-semibold uppercase tracking-[0.22em] text-site-hero-eyebrow"
            style={reveal(0.2)}
          >
            {kicker}
          </p>
        )}

        <h1
          className="max-w-[20ch] font-serif text-[clamp(36px,5.5vw,60px)] font-medium leading-[1.05] tracking-[-0.015em] text-white"
          style={reveal(0.35)}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="mt-5 max-w-[64ch] text-[clamp(16px,2vw,19px)] leading-[1.55] text-white/85"
            style={reveal(0.55)}
          >
            {subtitle}
          </p>
        )}

        {ctas && (
          <div className="mt-7 flex flex-wrap gap-3" style={reveal(0.75)}>
            {ctas}
          </div>
        )}
      </div>
    </section>
  );
}
