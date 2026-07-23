"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type ToastType = "success" | "error" | "info";

type Toast = { id: number; message: string; type: ToastType };

type AdminToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const AdminToastContext = createContext<AdminToastContextValue | null>(null);

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);
        dismiss(id);
      }, 4000);
      timersRef.current.add(timer);
    },
    [dismiss]
  );

  // Les minuteries survivaient au démontage et déclenchaient un setState
  // sur un composant disparu.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  // `value` était un objet neuf à chaque rendu, avec des fonctions `success` /
  // `error` recréées : toute la console admin (le provider enveloppe le
  // dashboard) se re-rendait à chaque toast, et les `useCallback` en aval qui
  // dépendent de `success`/`error` étaient invalidés en permanence.
  const value = useMemo<AdminToastContextValue>(
    () => ({
      toast,
      success: (m: string) => toast(m, "success"),
      error: (m: string) => toast(m, "error"),
    }),
    [toast]
  );

  return (
    <AdminToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "rounded-lg px-4 py-3 text-sm font-medium shadow-lg text-white animate-in slide-in-from-right",
              t.type === "success" && "bg-admin-ok-fg",
              t.type === "error" && "bg-admin-danger-fg",
              t.type === "info" && "bg-admin-deep"
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast() {
  const ctx = useContext(AdminToastContext);
  if (!ctx) throw new Error("useAdminToast must be used within AdminToastProvider");
  return ctx;
}
