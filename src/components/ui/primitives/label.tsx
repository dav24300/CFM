import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const labelVariants = cva("block text-sm font-medium text-cfm-navy", {
  variants: {
    required: {
      true: "after:ml-0.5 after:text-red-600 after:content-['*']",
      false: "",
    },
  },
  defaultVariants: {
    required: false,
  },
});

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement> &
  VariantProps<typeof labelVariants>;

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => (
    <label ref={ref} className={cn(labelVariants({ required }), "mb-1", className)} {...props}>
      {children}
    </label>
  )
);
Label.displayName = "Label";

export { labelVariants };
