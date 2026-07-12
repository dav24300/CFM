import { Shield } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Emplacement média « fini » — remplace les fonds rayés (effet chantier).
 * Dégradé sobre brandé + écusson CFM discret. À poser en `absolute inset-0`
 * (ou en bloc plein) dans un conteneur au ratio fixe.
 */
export function MediaPlaceholder({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "flex items-center justify-center",
        tone === "dark"
          ? "bg-gradient-to-br from-site-hero-dark to-site-deep"
          : "bg-gradient-to-br from-site-pale to-site-surface",
        className
      )}
    >
      <Shield
        className={cn("h-9 w-9", tone === "dark" ? "text-white/15" : "text-site-primary/20")}
        strokeWidth={1.5}
        aria-hidden
      />
    </div>
  );
}
