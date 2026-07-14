"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { Label } from "@/components/ui/primitives/label";
import { MediaPicker } from "@/components/admin/ui/media-picker";
import { useFocusTrap } from "@/components/admin/ui/use-focus-trap";
import { PROVINCES_RDC } from "@/lib/constants";
import { cn } from "@/lib/utils/cn";

export type EditorFieldType =
  | "text"
  | "url"
  | "number"
  | "textarea"
  | "select"
  | "province"
  | "date"
  | "toggle"
  | "image";

export type EditorField = {
  name: string;
  label: string;
  type: EditorFieldType;
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  colSpan?: 1 | 2;
  rows?: number;
  help?: string;
};

type Values = Record<string, unknown>;

type Props = {
  open: boolean;
  title: string;
  fields: EditorField[];
  initialValues?: Values;
  onClose: () => void;
  onSubmit: (values: Values) => Promise<void> | void;
  onDelete?: () => void;
  submitLabel?: string;
  /** Aperçu live optionnel, rendu au-dessus du formulaire. */
  preview?: (values: Values) => ReactNode;
};

/**
 * Éditeur en tiroir droit (slide-over) piloté par une config de champs.
 * Animé (framer-motion, respecte useReducedMotion). Champs routés sur les
 * primitives Input/Textarea/NativeSelect/Label. Réutilise MediaPicker (image).
 */
export function SlideOverEditor({
  open,
  title,
  fields,
  initialValues,
  onClose,
  onSubmit,
  onDelete,
  submitLabel = "Enregistrer",
  preview,
}: Props) {
  const reduced = useReducedMotion();
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  const [values, setValues] = useState<Values>(initialValues ?? {});
  const [saving, setSaving] = useState(false);
  const [pickingField, setPickingField] = useState<string | null>(null);

  // Réinitialise le formulaire à chaque ouverture / changement d'entité,
  // et nettoie l'état du sélecteur de média à la fermeture (évite l'auto-réouverture).
  useEffect(() => {
    if (open) setValues(initialValues ?? {});
    else setPickingField(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, JSON.stringify(initialValues ?? {})]);

  // Fermeture au clavier (Échap) — inhibée quand le MediaPicker est ouvert par-dessus
  // (sinon Échap fermerait l'éditeur sous-jacent et perdrait les saisies en cours).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pickingField) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, pickingField]);

  function set(name: string, value: unknown) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  async function submit() {
    // Validation minimale des champs requis.
    for (const f of fields) {
      if (f.required && !String(values[f.name] ?? "").trim()) return;
    }
    setSaving(true);
    try {
      await onSubmit(values);
    } finally {
      setSaving(false);
    }
  }

  const panelMotion = reduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="so-backdrop"
            className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
        {open && (
          <motion.div
            key="so-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            className="fixed inset-y-0 right-0 z-[90] flex h-full w-[min(640px,96vw)] flex-col bg-admin-bg shadow-admin-drawer focus:outline-none"
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            {...panelMotion}
          >
            {/* En-tête */}
            <div className="flex items-center justify-between border-b border-admin-border bg-admin-surface px-6 py-4">
              <h2 className="font-display text-lg font-semibold text-admin-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-admin-ctrl p-1.5 text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-ink"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corps */}
            <div className="flex-1 overflow-y-auto p-6">
              {preview && (
                <div className="mb-6 rounded-admin-card border border-admin-border bg-admin-surface p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-admin-muted">
                    Aperçu
                  </div>
                  {preview(values)}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.map((f) => (
                  <div key={f.name} className={cn(f.colSpan === 1 ? "" : "sm:col-span-2")}>
                    <FieldControl
                      field={f}
                      value={values[f.name]}
                      onChange={(v) => set(f.name, v)}
                      onPick={() => setPickingField(f.name)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Pied */}
            <div className="flex items-center justify-between gap-2 border-t border-admin-border bg-admin-surface px-6 py-4">
              <div>
                {onDelete && (
                  <Button type="button" variant="destructive" size="sm" onClick={onDelete}>
                    Supprimer
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="button" size="sm" loading={saving} onClick={submit}>
                  {submitLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {open && pickingField && (
        <MediaPicker
          open
          onClose={() => setPickingField(null)}
          onSelect={(path) => {
            set(pickingField, path);
            setPickingField(null);
          }}
          title="Choisir une image"
          accept="image/*"
        />
      )}
    </>
  );
}

function FieldControl({
  field: f,
  value,
  onChange,
  onPick,
}: {
  field: EditorField;
  value: unknown;
  onChange: (v: unknown) => void;
  onPick: () => void;
}) {
  const str = value == null ? "" : String(value);

  if (f.type === "toggle") {
    const on = Boolean(value);
    return (
      <div className="flex items-center justify-between rounded-admin-ctrl border border-admin-border bg-admin-surface px-3 py-2.5">
        <span className="text-sm font-medium text-admin-ink">{f.label}</span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={f.label}
          onClick={() => onChange(!on)}
          className={cn(
            "relative h-5 w-9 shrink-0 rounded-full transition-colors",
            on ? "bg-admin-accent" : "bg-admin-border"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-4 w-4 rounded-full bg-admin-surface shadow-sm transition-transform",
              on ? "translate-x-4" : "translate-x-0.5"
            )}
          />
        </button>
      </div>
    );
  }

  const label = (
    <Label htmlFor={f.name} required={f.required} className="mb-1.5">
      {f.label}
    </Label>
  );
  const help = f.help ? <p className="mt-1 text-xs text-admin-muted">{f.help}</p> : null;

  if (f.type === "textarea") {
    return (
      <div>
        {label}
        <Textarea
          id={f.name}
          rows={f.rows ?? 4}
          placeholder={f.placeholder}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm"
        />
        {help}
      </div>
    );
  }

  if (f.type === "select" || f.type === "province") {
    const options =
      f.type === "province"
        ? PROVINCES_RDC.map((p) => ({ value: p, label: p }))
        : f.options ?? [];
    return (
      <div>
        {label}
        <NativeSelect
          id={f.name}
          value={str}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm"
        >
          <option value="">— {f.placeholder ?? "Choisir"} —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
        {help}
      </div>
    );
  }

  if (f.type === "image") {
    return (
      <div>
        {label}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            id={f.name}
            className="flex-1 text-sm"
            placeholder={f.placeholder ?? "URL de l'image"}
            value={str}
            onChange={(e) => onChange(e.target.value)}
          />
          <Button type="button" size="sm" variant="secondary" onClick={onPick}>
            Choisir
          </Button>
        </div>
        {str && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={str}
            alt=""
            className="mt-2 h-20 w-auto rounded-admin-ctrl border border-admin-border object-contain"
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {label}
      <Input
        id={f.name}
        type={f.type === "number" ? "number" : f.type === "date" ? "date" : f.type === "url" ? "url" : "text"}
        className="text-sm"
        placeholder={f.placeholder}
        value={str}
        onChange={(e) => onChange(f.type === "number" ? Number(e.target.value) : e.target.value)}
      />
      {help}
    </div>
  );
}
