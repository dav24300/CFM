"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: number | string;
  label: string;
  suffix?: string;
};

export function StatCounter({ value, label, suffix = "" }: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();
  const numeric = typeof value === "number" ? value : null;
  const [display, setDisplay] = useState(reduceMotion || numeric === null ? String(value) : "0");

  useEffect(() => {
    if (!inView || reduceMotion || numeric === null) {
      setDisplay(String(value) + suffix);
      return;
    }

    const target = numeric;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();
    // Sans annulation, un changement de dépendances empilait des boucles rAF
    // concurrentes, et l'animation continuait après démontage.
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(target * eased);
      setDisplay(String(start) + suffix);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, numeric, reduceMotion, suffix, value]);

  return (
    <motion.div
      ref={ref}
      className="card text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4 }}
    >
      <p className="font-serif text-3xl font-bold text-site-primary md:text-4xl">{display}</p>
      <p className="mt-1 text-sm text-site-muted">{label}</p>
    </motion.div>
  );
}
