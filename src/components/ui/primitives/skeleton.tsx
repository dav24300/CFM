import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const skeletonVariants = cva("animate-pulse bg-site-deep/10", {
  variants: {
    variant: {
      text: "h-4 w-full rounded",
      circle: "rounded-full",
      rect: "rounded-lg",
      card: "rounded-none h-48 w-full",
    },
  },
  defaultVariants: {
    variant: "text",
  },
});

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof skeletonVariants>;

export function Skeleton({ className, variant, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(skeletonVariants({ variant }), className)}
      {...props}
    />
  );
}

export type SkeletonListProps = {
  count?: number;
  variant?: "text" | "circle" | "rect" | "card";
  className?: string;
};

export function SkeletonList({ count = 3, variant = "card", className }: SkeletonListProps) {
  return (
    <div className={cn("space-y-4", className)} aria-busy="true" aria-label="Chargement">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} className={variant === "card" ? "h-40" : undefined} />
      ))}
    </div>
  );
}

export { skeletonVariants };
