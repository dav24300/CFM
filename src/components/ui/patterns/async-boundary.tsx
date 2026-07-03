import * as React from "react";

export type AsyncBoundaryProps = {
  isLoading: boolean;
  isEmpty: boolean;
  loading: React.ReactNode;
  empty: React.ReactNode;
  error?: React.ReactNode;
  hasError?: boolean;
  children: React.ReactNode;
};

export function AsyncBoundary({
  isLoading,
  isEmpty,
  loading,
  empty,
  error,
  hasError = false,
  children,
}: AsyncBoundaryProps) {
  if (isLoading) return <>{loading}</>;
  if (hasError && error) return <>{error}</>;
  if (isEmpty) return <>{empty}</>;
  return <>{children}</>;
}
