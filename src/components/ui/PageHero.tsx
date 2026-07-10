import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Breadcrumb = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  breadcrumbs?: Breadcrumb[];
};

export function PageHero({ title, subtitle, image, imageAlt = "", breadcrumbs }: Props) {
  const breadcrumbNav = breadcrumbs && breadcrumbs.length > 0 && (
    <nav aria-label="Fil d'Ariane" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-300">
        {breadcrumbs.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-site-primary/70" aria-hidden />}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-site-primary">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-site-primary">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );

  if (image) {
    return (
      <section className="relative overflow-hidden bg-site-deep text-white">
        <div className="absolute inset-0">
          <Image
            src={image}
            alt={imageAlt || title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="hero-overlay" aria-hidden />
        </div>
        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28">
          {breadcrumbNav}
          <h1 className="font-serif text-4xl font-bold text-balance md:text-5xl">{title}</h1>
          {subtitle && <p className="mt-4 max-w-2xl text-lg text-gray-200">{subtitle}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-site-primary/20 bg-site-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {breadcrumbNav && (
          <nav aria-label="Fil d'Ariane" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-site-muted">
              {breadcrumbs!.map((crumb, i) => (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3" aria-hidden />}
                  {crumb.href ? (
                    <Link href={crumb.href} className="hover:text-site-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-site-ink">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="section-title">{title}</h1>
        {subtitle && <p className="section-subtitle max-w-3xl">{subtitle}</p>}
      </div>
    </section>
  );
}
