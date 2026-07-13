import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const alertVariants = cva("rounded-lg border px-4 py-3 text-sm", {
  variants: {
    variant: {
      info: "border-[var(--control-info-border)] bg-[var(--control-info-bg)] text-[var(--control-info-fg)]",
      success: "border-[var(--control-success-border)] bg-[var(--control-success-bg)] text-[var(--control-success-fg)]",
      warning: "border-[var(--control-warn-border)] bg-[var(--control-warn-bg)] text-[var(--control-warn-fg)]",
      error: "border-[var(--control-error-border)] bg-[var(--control-error-bg)] text-[var(--control-error-fg)]",
    },
  },
  defaultVariants: {
    variant: "info",
  },
});

export type AlertProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof alertVariants> & {
    live?: "polite" | "assertive" | "off";
  };

export function Alert({ className, variant, live = "polite", children, ...props }: AlertProps) {
  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      aria-live={live}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { alertVariants };
