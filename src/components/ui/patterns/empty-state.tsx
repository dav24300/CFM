import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Button, buttonVariants } from "../primitives/button";

export type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  variant?: "compact" | "page" | "card";
  className?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "page",
  className,
}: EmptyStateProps) {
  const wrapperClass = cn(
    "flex flex-col items-center text-center",
    variant === "page" && "py-12",
    variant === "card" && "card py-8",
    variant === "compact" && "py-4",
    className
  );

  return (
    <div className={wrapperClass} role="status">
      {icon && <div className="mb-4 text-cfm-gold">{icon}</div>}
      <h3 className="font-display text-lg font-bold text-cfm-navy">{title}</h3>
      {description && <p className="mt-2 max-w-md text-sm text-cfm-earth">{description}</p>}
      {action && (
        <div className="mt-4">
          {action.href ? (
            <a
              href={action.href}
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              {action.label}
            </a>
          ) : (
            <Button variant="secondary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
