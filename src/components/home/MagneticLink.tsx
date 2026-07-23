"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  "data-cta"?: string;
  ariaLabel?: string;
};

/**
 * Lien "magnétique" : suit légèrement le curseur au survol (cf. Accueil.dc.html).
 * Désactivé si prefers-reduced-motion.
 */
export function MagneticLink({ href, className, children, ariaLabel, ...rest }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = usePrefersReducedMotion();

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.28;
    const y = (e.clientY - r.top - r.height / 2) * 0.4;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  }
  function reset() {
    const el = ref.current;
    if (el) el.style.transform = "translate(0,0)";
  }

  return (
    <Link
      ref={ref}
      href={href}
      className={className}
      onMouseMove={onMove}
      onMouseLeave={reset}
      aria-label={ariaLabel}
      data-cta={rest["data-cta"]}
      style={{ willChange: "transform", transition: "background-color .25s, color .25s" }}
    >
      {children}
    </Link>
  );
}
