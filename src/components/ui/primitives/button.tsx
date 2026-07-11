import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";
import { Spinner } from "./spinner";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition rounded-[var(--control-radius)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--control-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--control-ring-offset)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--control-accent)] text-[var(--control-accent-fg)] hover:bg-[var(--control-accent-hover)] hover:shadow-site-hover",
        secondary:
          "border border-[var(--control-accent)] text-[var(--control-accent)] hover:bg-[var(--control-accent)] hover:text-[var(--control-accent-fg)]",
        outline:
          "border border-[var(--control-accent)] text-[var(--control-accent)] hover:bg-[var(--control-accent)] hover:text-[var(--control-accent-fg)]",
        outlineLight:
          "border border-white text-white hover:bg-white hover:text-[var(--control-accent)]",
        ghost: "text-[var(--control-accent)] hover:bg-[var(--control-surface)]",
        destructive: "bg-[var(--control-danger)] text-white hover:opacity-90",
      },
      size: {
        sm: "px-3 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" className="shrink-0" aria-hidden />}
      {children}
    </button>
  )
);
Button.displayName = "Button";

export { buttonVariants };
