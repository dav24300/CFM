import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const textareaVariants = cva(
  "w-full rounded-lg border px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-cfm-gold/30 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:border-cfm-gold",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500/30",
        success: "border-green-600 focus:border-green-600 focus:ring-green-600/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> &
  VariantProps<typeof textareaVariants> & {
    showCount?: boolean;
    maxLength?: number;
  };

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, showCount, maxLength, value, onChange, id, ...props }, ref) => {
    const length = typeof value === "string" ? value.length : 0;
    const countId = showCount && id ? `${id}-count` : undefined;

    return (
      <div className="space-y-1">
        <textarea
          ref={ref}
          id={id}
          className={cn(textareaVariants({ variant }), className)}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          aria-describedby={countId}
          {...props}
        />
        {showCount && maxLength && (
          <p id={countId} className="text-right text-xs text-cfm-earth" aria-live="polite">
            {length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { textareaVariants };
