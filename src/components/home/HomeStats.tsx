"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

type Stat = { value?: number; text?: string; label: string };

function CountUp({ target }: { target: number }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setDisplay(target);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let started = false;
    let frame = 0;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started) {
            started = true;
            const dur = 1500;
            const start = performance.now();
            const step = (now: number) => {
              const p = Math.min(1, (now - start) / dur);
              setDisplay(Math.round(target * (1 - Math.pow(1 - p, 3))));
              if (p < 1) frame = requestAnimationFrame(step);
              else setDisplay(target);
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
  }, [target, reduced]);

  return <span ref={ref}>{display}</span>;
}

export function HomeStats({ stats }: { stats: Stat[] }) {
  return (
    <section className="mx-auto max-w-site px-6">
      <div className="grid grid-cols-1 border-b border-site-hairline sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`py-11 ${i === 0 ? "pr-2 sm:border-r sm:border-site-hairline" : "px-2 sm:border-r sm:border-site-hairline sm:pl-8"} ${
              i === stats.length - 1 ? "sm:border-r-0" : ""
            }`}
          >
            <div className="font-serif text-h1 font-medium leading-none text-site-primary">
              {typeof s.value === "number" ? <CountUp target={s.value} /> : s.text}
            </div>
            <div className="mt-2 text-[13px] font-medium uppercase tracking-[0.04em] text-site-muted-2">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
