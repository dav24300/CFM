"use client";

import { useCallback, useState } from "react";

export type AsyncStatus = "idle" | "loading" | "success" | "error";

export function useAsyncAction<T = void>() {
  const [status, setStatus] = useState<AsyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const run = useCallback(async (action: () => Promise<T>) => {
    setStatus("loading");
    setError(null);
    try {
      const result = await action();
      setData(result);
      setStatus("success");
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur";
      setError(message);
      setStatus("error");
    }
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setData(null);
  }, []);

  return {
    status,
    error,
    data,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
    run,
    reset,
    setStatus,
    setError,
  };
}
