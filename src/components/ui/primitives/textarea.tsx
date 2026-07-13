import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const textareaVariants = cva(
  "w-full rounded-[var(--control-radius)] border bg-[var(--control-bg)] px-4 py-3 text-[var(--control-fg)] transition focus:outline-none focus:ring-2 focus:ring-[var(--control-ring)] disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-[var(--control-border)] focus:border-[var(--control-border-strong)]",
        error:
          "border-[var(--control-danger)] focus:border-[var(--control-danger)] focus:ring-[var(--control-danger-ring)]",
        success: "border-[var(--control-success)] focus:border-[var(--control-success)]",
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
          <p id={countId} className="text-right text-xs text-[var(--control-muted)]" aria-live="polite">
            {length}/{maxLength}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { textareaVariants };
