import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const inputVariants = cva(
  "w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-site-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:border-site-primary",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500/30",
        success: "border-green-600 focus:border-green-600 focus:ring-green-600/30",
        footer:
          "border-0 bg-white/10 text-white placeholder:text-gray-400 focus:ring-site-primary",
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
