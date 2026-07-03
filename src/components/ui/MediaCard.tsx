import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ImageIcon } from "lucide-react";
import { Badge } from "./primitives/badge";
import { Skeleton } from "./primitives/skeleton";

type Props = {
  image?: string | null;
  imageAlt?: string;
  title: string;
  excerpt?: string | null;
  href?: string;
  badge?: string;
  ctaLabel?: string;
  className?: string;
  loading?: boolean;
};

export function MediaCard({
  image,
  imageAlt = "",
  title,
  excerpt,
  href,
  badge,
  ctaLabel = "Découvrir",
  className = "",
  loading = false,
}: Props) {
  const content = (
    <>
      <div className="image-zoom-hover relative aspect-video overflow-hidden bg-cfm-cream">
        {loading ? (
          <Skeleton variant="rect" className="h-full w-full rounded-none" />
        ) : image ? (
          <Image
            src={image}
            alt={imageAlt || title}
            fill
            className="zoom-target object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-cfm-cream text-cfm-earth/40"
            aria-hidden
          >
            <ImageIcon className="h-12 w-12" />
          </div>
        )}
        {badge && (
          <Badge variant="default" className="absolute left-3 top-3 bg-cfm-navy/90 text-cfm-gold">
            {badge}
          </Badge>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-display text-lg font-bold text-cfm-navy line-clamp-2">{title}</h3>
        {excerpt && (
          <p className="mt-2 text-sm text-cfm-earth line-clamp-3">{excerpt}</p>
        )}
        {href && (
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cfm-gold">
            {ctaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`card-media block group ${className}`}>
        {content}
      </Link>
    );
  }

  return <article className={`card-media ${className}`}>{content}</article>;
}
