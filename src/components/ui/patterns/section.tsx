import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { ScrollReveal } from "../ScrollReveal";

export type SectionProps = {
  title?: string;
  subtitle?: string;
  titleLight?: boolean;
  animate?: boolean;
  className?: string;
  containerClassName?: string;
  children: React.ReactNode;
};

export function Section({
  title,
  subtitle,
  titleLight = false,
  animate = false,
  className,
  containerClassName,
  children,
}: SectionProps) {
  const content = (
    <div className={cn("mx-auto max-w-6xl px-4 md:px-6", containerClassName)}>
      {(title || subtitle) && (
        <header className="mb-8 md:mb-12">
          {title && (
            <h2
              className={cn(
                "font-serif text-3xl font-bold md:text-4xl",
                titleLight ? "text-white" : "text-site-ink"
              )}
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p
              className={cn(
                "mt-3 max-w-3xl text-lg line-clamp-2",
                titleLight ? "text-gray-200" : "text-site-muted"
              )}
            >
              {subtitle}
            </p>
          )}
        </header>
      )}
      {children}
    </div>
  );

  return (
    <section className={cn("py-24 md:py-32", className)}>
      {animate ? <ScrollReveal>{content}</ScrollReveal> : content}
    </section>
  );
}
