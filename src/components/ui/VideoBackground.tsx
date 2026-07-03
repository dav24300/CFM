"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";

type Props = {
  src: string;
  poster: string;
  alt?: string;
  className?: string;
};

export function VideoBackground({ src, poster, alt = "", className = "" }: Props) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <Image
        src={poster}
        alt={alt}
        fill
        className={`object-cover ${className}`}
        sizes="100vw"
        priority
      />
    );
  }

  return (
    <video
      className={`h-full w-full object-cover ${className}`}
      autoPlay
      muted
      loop
      playsInline
      poster={poster}
      aria-label={alt}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}
