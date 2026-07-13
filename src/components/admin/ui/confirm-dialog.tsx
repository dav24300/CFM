"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  const reduced = useReducedMotion();

  // Fermeture au clavier (Échap) → annulation.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cd-backdrop"
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={onCancel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-admin-card border border-admin-border bg-admin-surface p-6 shadow-admin-overlay"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 8 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <div className="flex gap-4">
              {destructive && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-admin-danger-bg text-admin-danger-fg">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-admin-ink">{title}</h3>
                <p className="mt-1.5 text-sm text-admin-muted">{message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
                Annuler
              </Button>
              <Button
                type="button"
                size="sm"
                variant={destructive ? "destructive" : "primary"}
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
