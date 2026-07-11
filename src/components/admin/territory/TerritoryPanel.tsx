"use client";

import { useState } from "react";
import { PROVINCES_RDC } from "@/lib/constants";
import { Button } from "@/components/ui/primitives/button";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { SlideOverEditor, type EditorField } from "@/components/admin/ui/slide-over-editor";
import { PreviewButton } from "@/components/admin/ui/preview-button";
import { useAdminApi } from "@/components/admin/hooks/useAdminApi";
import type { AdminData } from "@/components/admin/types";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

type Row = Record<string, unknown>;
type Props = { data: AdminData; onReload: () => void };

const FIELDS: EditorField[] = [
  { name: "province", label: "Province", type: "province", required: true, colSpan: 1 },
  { name: "title", label: "Titre", type: "text", required: true, colSpan: 1 },
  { name: "date", label: "Date", type: "date", colSpan: 1 },
  {
    name: "type",
    label: "Type",
    type: "select",
    colSpan: 1,
    options: [
      { value: "action", label: "Action" },
      { value: "atelier", label: "Atelier" },
      { value: "plaidoyer", label: "Plaidoyer" },
    ],
  },
  { name: "description", label: "Description", type: "textarea", colSpan: 2, rows: 3 },
  { name: "photo", label: "Photo", type: "image", colSpan: 2 },
];

export function TerritoryPanel({ data, onReload }: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { post } = useAdminApi(onReload);

  const actions = (data.actions || []) as Row[];
  const editing = editId ? actions.find((a) => Number(a.id) === editId) ?? null : null;
  const coveredProvinces = new Set(actions.map((a) => String(a.province)));

  const columns: Column<Row>[] = [
    { key: "province", header: "Province", sortable: true },
    { key: "title", header: "Titre", sortable: true },
    { key: "type", header: "Type" },
    { key: "date", header: "Date", sortable: true },
  ];

  function initialValues(): Record<string, unknown> {
    if (!editing) return { type: "action", province: PROVINCES_RDC[0] };
    return {
      province: editing.province ?? "",
      title: editing.title ?? "",
      date: editing.date ?? "",
      type: editing.type ?? "action",
      description: editing.description ?? "",
      photo: editing.photo ?? "",
    };
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = {
      province: String(values.province || ""),
      title: String(values.title || ""),
      description: String(values.description || ""),
      date: String(values.date || ""),
      type: String(values.type || "action"),
      photo: String(values.photo || ""),
    };
    await post(
      editId
        ? { action: "update_content", table: "actions", id: editId, data: payload }
        : { action: "create", table: "actions", data: payload }
    );
    setEditorOpen(false);
    setEditId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-admin-ink">Actions & territoire</h2>
        <div className="flex gap-2">
          <PreviewButton href="/actions" tags={[CACHE_TAGS.actions, CACHE_TAGS.content]} />
          <Button type="button" size="sm" onClick={() => { setEditId(null); setEditorOpen(true); }}>
            + Action
          </Button>
        </div>
      </div>

      <section className="rounded-admin border border-admin-border bg-admin-surface p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase text-admin-muted">
          Couverture RDC — {coveredProvinces.size}/{PROVINCES_RDC.length} provinces
        </h3>
        <div className="flex flex-wrap gap-1">
          {PROVINCES_RDC.map((p) => (
            <span
              key={p}
              className={`rounded px-2 py-0.5 text-xs ${
                coveredProvinces.has(p) ? "badge-ok" : "bg-admin-bg text-admin-muted"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
      </section>

      <DataTable
        data={actions}
        columns={columns}
        searchKeys={["province", "title"]}
        rowKey={(r) => Number(r.id)}
        actions={(row) => (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => { setEditId(Number(row.id)); setEditorOpen(true); }}
            >
              Modifier
            </Button>
            <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteId(Number(row.id))}>
              Suppr.
            </Button>
          </div>
        )}
      />

      <SlideOverEditor
        open={editorOpen}
        title={editId ? "Modifier l’action" : "Nouvelle action"}
        fields={FIELDS}
        initialValues={initialValues()}
        onClose={() => { setEditorOpen(false); setEditId(null); }}
        onSubmit={handleSubmit}
        onDelete={editId ? () => { setEditorOpen(false); setDeleteId(editId); } : undefined}
        preview={(v) => (
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-admin-muted">
              {String(v.province || "—")}
              {v.type ? ` · ${v.type}` : ""}
            </div>
            <div className="mt-1 font-display text-sm font-semibold text-admin-ink">
              {String(v.title || "Nouvelle action")}
            </div>
          </div>
        )}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Supprimer cette action ?"
        message="L'action sera retirée de la carte."
        destructive
        onConfirm={async () => {
          if (deleteId) await post({ action: "delete", table: "actions", id: deleteId });
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
