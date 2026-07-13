"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { Label } from "../primitives/label";

export type FormFieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactElement<Record<string, unknown>>;
};

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const childProps: Record<string, unknown> = {
    id: htmlFor,
    "aria-invalid": error ? "true" : children.props["aria-invalid"],
    "aria-describedby": describedBy ?? children.props["aria-describedby"],
  };

  if (error && "variant" in children.props) {
    childProps.variant = "error";
  }

  const child = React.cloneElement(children, childProps);

  return (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={htmlFor} required={required}>
        {label}
      </Label>
      {child}
      {hint && (
        <p id={hintId} className="text-xs text-[var(--control-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-sm text-[var(--control-danger)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
