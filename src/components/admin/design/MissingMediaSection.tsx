"use client";

import { useEffect, useState } from "react";
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
      <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
        Tous les contenus ont un visuel assigné.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-admin-muted">{items.length} élément(s) sans visuel</p>
      <ul className="divide-y rounded-xl border bg-white">
        {items.map((item) => (
          <li key={`${item.type}-${item.id}`} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div>
              <strong>{item.title}</strong>
              <span className="ml-2 text-xs text-gray-500">
                {item.type} · {item.field}
              </span>
            </div>
            <button
              type="button"
              className="shrink-0 rounded bg-admin-deep px-3 py-1 text-xs text-white"
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
