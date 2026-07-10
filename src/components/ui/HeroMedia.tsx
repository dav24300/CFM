"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  image: string;
  imageAlt?: string;
  video?: string | null;
  poster?: string;
  overlay?: boolean;
  priority?: boolean;
  className?: string;
  children: React.ReactNode;
};

function useSlowConnection() {
  const [isSlow, setIsSlow] = useState(false);

  useEffect(() => {
    type NetworkInfo = EventTarget & {
      effectiveType?: string;
      saveData?: boolean;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };

    const connection = (navigator as Navigator & { connection?: NetworkInfo }).connection;
    if (!connection) return;

    const conn = connection;

    function checkSlow() {
      setIsSlow(
        conn.saveData === true ||
          conn.effectiveType === "2g" ||
          conn.effectiveType === "3g" ||
          conn.effectiveType === "slow-2g"
      );
    }

    checkSlow();
    conn.addEventListener?.("change", checkSlow);
    return () => conn.removeEventListener?.("change", checkSlow);
  }, []);

  return isSlow;
}

export function HeroMedia({
  image,
  imageAlt = "",
  video,
  poster,
  overlay = true,
  priority = true,
  className = "",
  children,
}: Props) {
  const reduceMotion = useReducedMotion();
  const isSlowConnection = useSlowConnection();
  const showVideo = Boolean(video) && !reduceMotion && !isSlowConnection;

  return (
    <section className={`relative min-h-[85vh] overflow-hidden bg-site-deep text-white ${className}`}>
      <div className="absolute inset-0">
        {showVideo ? (
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            poster={poster || image}
            aria-hidden
          >
            <source src={video!} type="video/mp4" />
          </video>
        ) : (
          <Image
            src={poster || image}
            alt={imageAlt}
            fill
            priority={priority}
            className="object-cover"
            sizes="100vw"
          />
        )}
        {overlay && <div className="hero-overlay" aria-hidden />}
      </div>

      <motion.div
        className="relative mx-auto flex min-h-[85vh] max-w-6xl flex-col justify-center px-4 py-24 md:py-32"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.12 } },
        }}
      >
        {children}
      </motion.div>
    </section>
  );
}

export function HeroItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={className}
      variants={
        reduceMotion
          ? { hidden: { opacity: 1 }, visible: { opacity: 1 } }
          : { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55 } } }
      }
    >
      {children}
    </motion.div>
  );
}
