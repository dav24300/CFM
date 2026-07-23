"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
};

/**
 * Apparition au défilement, une seule fois, en CSS pur.
 *
 * Utilisé 37 fois sur 9 routes publiques, ce composant était l'UNIQUE raison
 * pour laquelle framer-motion entrait dans leur bundle — pour un simple
 * fondu-translation joué une fois, sans interpolation continue.
 *
 * L'état masqué n'est JAMAIS présent dans le HTML servi : il est posé par le
 * script au montage. Sans JavaScript (ou si le script échoue), le contenu
 * reste visible au lieu de disparaître définitivement.
 */
const OFFSETS: Record<NonNullable<Props["direction"]>, string> = {
  up: "translateY(24px)",
  down: "translateY(-24px)",
  left: "translateX(-32px)",
  right: "translateX(32px)",
  none: "none",
};

// Même courbe que l'implémentation framer-motion précédente ([.25,.1,.25,1]).
const EASING = "cubic-bezier(.25,.1,.25,1)";

// useLayoutEffect pose l'état masqué AVANT le premier paint (donc sans
// clignotement), mais React le refuse au rendu serveur.
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    el.style.opacity = "0";
    el.style.transform = OFFSETS[direction];

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        el.style.transition = `opacity .5s ${EASING} ${delay}s, transform .5s ${EASING} ${delay}s`;
        el.style.opacity = "1";
        el.style.transform = "none";
      },
      { rootMargin: "-10% 0px" }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      // Si la préférence bascule vers « animations réduites », l'élément ne
      // doit pas rester figé dans son état masqué.
      el.style.opacity = "";
      el.style.transform = "";
      el.style.transition = "";
    };
  }, [reduced, direction, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
