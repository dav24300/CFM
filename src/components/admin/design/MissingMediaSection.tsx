"use client";

import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { MediaPicker } from "@/components/admin/ui/media-picker";
import type { MissingMediaItem } from "@/domain/media";

export function MissingMediaSection() {
  const [items, setItems] = useState<MissingMediaItem[]>([]);
  const [picker, setPicker] = useState<MissingMediaItem | null>(null);
  const { success, error } = useAdminToast();

  async function load() {
    const res = await fetch("/api/admin/media/missing");
    if (res.ok) {
      const data = await res.json();
      setItems(data.missing || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function assign(path: string) {
    if (!picker) return;
    const res = await fetch("/api/admin/media/assign", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: picker.type,
        id: picker.id,
        field: picker.field,
        path,
      }),
    });
    if (!res.ok) {
      error("Assignation échouée");
      return;
    }
    success("Visuel assigné");
    setPicker(null);
    load();
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-admin-card border border-admin-ok-fg/25 bg-admin-ok-bg p-4 text-sm font-medium text-admin-ok-fg">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Tous les contenus ont un visuel assigné.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-admin-muted">{items.length} élément(s) sans visuel</p>
      <ul className="divide-y divide-admin-border rounded-admin-card border border-admin-border bg-admin-surface shadow-admin-rest">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div>
              <strong className="text-admin-ink">{item.title}</strong>
              <span className="ml-2 text-xs text-admin-muted-2">
                {item.type} · {item.field}
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-admin-ctrl bg-admin-deep px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
              onClick={() => setPicker(item)}
            >
              Assigner
            </button>
          </li>
        ))}
      </ul>

      {picker && (
        <MediaPicker
          open
          onClose={() => setPicker(null)}
          onSelect={assign}
          title={`Visuel pour : ${picker.title}`}
        />
      )}
    </div>
  );
}
