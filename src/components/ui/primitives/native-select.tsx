import * as React from "react";
import { inputVariants } from "../primitives/input";
import { cn } from "@/lib/utils/cn";
import type { VariantProps } from "class-variance-authority";

export type NativeSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> &
  VariantProps<typeof inputVariants>;

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, variant, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(inputVariants({ variant }), className)}
      {...props}
    >
      {children}
    </select>
  )
);
NativeSelect.displayName = "NativeSelect";
