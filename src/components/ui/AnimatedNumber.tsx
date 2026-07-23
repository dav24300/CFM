"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-prefers-reduced-motion";

/** Compteur animé (count-up) déclenché à l'entrée dans le viewport. */
export function AnimatedNumber({
  value,
  className,
  format,
}: {
  value: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let started = false;
    // La boucle rAF survivait au démontage : elle continuait jusqu'à 1,4 s en
    // appelant setDisplay sur un composant disparu.
    let frame = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true;
            const dur = 1400;
            const start = performance.now();
            const step = (now: number) => {
              const prog = Math.min(1, (now - start) / dur);
              setDisplay(Math.round(value * (1 - Math.pow(1 - prog, 3))));
              if (prog < 1) frame = requestAnimationFrame(step);
              else setDisplay(value);
            };
            frame = requestAnimationFrame(step);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value, reduced]);

  return (
    <span ref={ref} className={className}>
      {format ? format(display) : display}
    </span>
  );
}
