import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const inputVariants = cva(
  "w-full rounded-[var(--control-radius)] border bg-[var(--control-bg)] px-4 py-3 text-[var(--control-fg)] transition focus:outline-none focus:ring-2 focus:ring-[var(--control-ring)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-[var(--control-border)] focus:border-[var(--control-border-strong)]",
        error:
          "border-[var(--control-danger)] focus:border-[var(--control-danger)] focus:ring-[var(--control-danger-ring)]",
        success: "border-site-success focus:border-site-success",
        footer:
          "border-0 bg-white/10 text-white placeholder:text-gray-400 focus:ring-[var(--control-ring)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputVariants>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(inputVariants({ variant }), className)}
      {...props}
    />
  )
);
Input.displayName = "Input";

export { inputVariants };
