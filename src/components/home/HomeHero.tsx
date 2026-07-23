"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { ArrowDown } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";
import { MagneticLink } from "./MagneticLink";

type Props = {
  image: string;
  imageAlt: string;
  video?: string;
  poster?: string;
  kicker: string;
  subtitle: string;
  liveHref: string;
  hasLive: boolean;
  liveLabel: string;
  helpLabel: string;
  liveBadgeLabel: string;
  helpHref: string;
};

// Titre éditorial de marque (cf. Accueil.dc.html) — révélé mot par mot.
const LINE_1 = ["Derrière", "chaque", "uniforme,"];
const LINE_2: Array<{ w: string; italic?: boolean }> = [
  { w: "un" },
  { w: "visage" },
  { w: "de" },
  { w: "famille", italic: true },
];
const DELAYS_1 = [0.34, 0.4, 0.46];
const DELAYS_2 = [0.56, 0.62, 0.68, 0.74];

export function HomeHero({
  image,
  imageAlt,
  video,
  poster,
  kicker,
  subtitle,
  liveHref,
  hasLive,
  liveLabel,
  helpLabel,
  liveBadgeLabel,
  helpHref,
}: Props) {
  const reduced = usePrefersReducedMotion();
  const [interactive, setInteractive] = useState(false);
  const scopeRef = useRef<HTMLElement>(null);
  const baseRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  // Parallaxe curseur (bureau, pointeur fin, mouvement autorisé).
  useEffect(() => {
    if (reduced) return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (!fine) return;
    setInteractive(true);
    const scope = scopeRef.current;
    if (!scope) return;
    const layers: Array<[HTMLElement | null, number]> = [
      [baseRef.current, 0.045],
      [gridRef.current, 0.09],
      [contentRef.current, -0.035],
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

  const revealStyle = (delay: number): React.CSSProperties =>
    reduced ? {} : { animation: `fu .7s ${delay}s both` };

  return (
    <section
      ref={scopeRef}
      className="relative flex min-h-[min(760px,90vh)] items-end overflow-hidden bg-site-hero-dark"
    >
      {/* Couche 1 — média plein cadre + ken-burns */}
      <div ref={baseRef} className="absolute inset-[-34px]">
        <div className="absolute inset-0 origin-[60%_40%] animate-none" style={reduced ? undefined : { animation: "kb 18s ease-in-out infinite alternate" }}>
          <Image src={image} alt={imageAlt} fill priority className="object-cover" sizes="100vw" />
          {video && !reduced && (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={poster}
            >
              <source src={video} type="video/mp4" />
            </video>
          )}
        </div>
      </div>

      {/* Couche 2 — grille technique */}
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

      {/* Overlay dégradé */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(115deg,rgba(10,18,36,.74),rgba(15,17,20,.30) 55%,rgba(15,17,20,.84))",
        }}
        aria-hidden
      />

      {/* Badge EN DIRECT */}
      {hasLive && (
        <Link
          href={liveHref}
          className="absolute right-8 top-5 inline-flex animate-live-pulse items-center gap-2 bg-site-live px-3 py-[7px] text-[11px] font-bold uppercase tracking-[0.06em] text-white"
          data-cta="cta_live"
        >
          <span className="h-1.5 w-1.5 bg-white" aria-hidden />
          {liveBadgeLabel}
        </Link>
      )}

      {/* Contenu */}
      <div
        ref={contentRef}
        className="relative mx-auto w-full max-w-site px-6 pb-[72px] pt-24"
      >
        <div className="max-w-[900px]">
          <div
            className="mb-6 h-[3px] w-[72px] origin-left"
            style={{
              background: "linear-gradient(90deg,#14418a,#7aa7f5,#14418a)",
              backgroundSize: "200% 100%",
              ...(reduced ? {} : { animation: "grow .9s .1s both, shim 3s 1s linear infinite" }),
            }}
            aria-hidden
          />
          <p
            className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-site-hero-eyebrow"
            style={revealStyle(0.2)}
          >
            {kicker}
          </p>
          <h1 className="font-serif text-display font-medium leading-[1.03] tracking-[-0.015em] text-white">
            {LINE_1.map((w, i) => (
              <span key={w} className="inline-block" style={revealStyle(DELAYS_1[i])}>
                {w}
                {i < LINE_1.length - 1 ? " " : ""}
              </span>
            ))}
            <br />
            {LINE_2.map((item, i) => (
              <span
                key={item.w}
                className={`inline-block ${item.italic ? "italic text-[#bcd2f7]" : ""}`}
                style={revealStyle(DELAYS_2[i])}
              >
                {item.w}
                {i < LINE_2.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p
            className="mt-[22px] max-w-[56ch] text-lead leading-[1.55] text-white/90"
            style={revealStyle(0.8)}
          >
            {subtitle}
          </p>
          <div
            className="mt-8 flex flex-wrap items-center gap-3"
            style={reduced ? {} : { animation: "fu .9s .95s both" }}
          >
            <MagneticLink
              href={liveHref}
              className="inline-flex items-center gap-2.5 bg-site-primary px-7 py-4 text-[15px] font-semibold text-white hover:bg-site-primary-dark"
              data-cta="cta_live"
            >
              <span className="h-2 w-2 bg-site-live" aria-hidden />
              {liveLabel}
            </MagneticLink>
            <Link
              href={helpHref}
              className="inline-flex items-center gap-2.5 border border-white/60 px-[26px] py-[15px] text-[15px] font-semibold text-white transition hover:bg-white hover:text-site-ink"
              data-cta="cta_aide"
            >
              {helpLabel} →
            </Link>
          </div>
        </div>
      </div>

      {/* Indicateur de défilement */}
      {interactive && (
        <div className="absolute bottom-[22px] left-1/2 -translate-x-1/2 text-white/50" aria-hidden>
          <div style={{ animation: "bob 2.4s ease-in-out infinite" }}>
            <ArrowDown className="h-[22px] w-[22px]" />
          </div>
        </div>
      )}
    </section>
  );
}
