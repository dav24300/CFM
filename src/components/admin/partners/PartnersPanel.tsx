"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2, Handshake } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { SlideOverEditor, type EditorField } from "@/components/admin/ui/slide-over-editor";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { PreviewButton } from "@/components/admin/ui/preview-button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

type Partner = {
  id: number;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  sort_order: number;
};

const FIELDS: EditorField[] = [
  { name: "name", label: "Nom", type: "text", required: true, colSpan: 1, placeholder: "Nom du partenaire" },
  { name: "website", label: "Site web", type: "url", colSpan: 1, placeholder: "https://…" },
  { name: "logo_url", label: "Logo", type: "image", colSpan: 2 },
  { name: "description", label: "Description", type: "textarea", colSpan: 2, rows: 3 },
];

export function PartnersPanel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { success, error } = useAdminToast();

  const editing = editId ? partners.find((p) => p.id === editId) ?? null : null;

  async function load() {
    const res = await fetch("/api/admin/partners");
    if (res.ok) {
      const data = await res.json();
      setPartners(data.partners || []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditId(null);
    setEditorOpen(true);
  }
  function openEdit(partner: Partner) {
    setEditId(partner.id);
    setEditorOpen(true);
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const payload = {
      name: values.name,
      website: values.website || null,
      logo_url: values.logo_url || null,
      description: values.description || null,
    };
    const res = editId
      ? await fetch("/api/admin/partners", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, ...payload }),
        })
      : await fetch("/api/admin/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
    if (!res.ok) {
      error(editId ? "Échec mise à jour" : "Échec création");
      return;
    }
    success(editId ? "Partenaire mis à jour" : "Partenaire ajouté");
    setEditorOpen(false);
    setEditId(null);
    load();
  }

  const columns: Column<Partner>[] = [
    { key: "name", header: "Nom", sortable: true },
    { key: "website", header: "Site" },
    { key: "sort_order", header: "Ordre" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partenaires"
        subtitle="Logos et liens des partenaires affichés dans le pied de page du site."
        actions={
          <>
            <PreviewButton href="/#footer" tags={[CACHE_TAGS.partners]} label="Voir Footer" />
            <Button type="button" size="sm" onClick={openNew}>
              + Partenaire
            </Button>
          </>
        }
      />

      <DataTable
        data={partners as unknown as Record<string, unknown>[]}
        columns={columns as Column<Record<string, unknown>>[]}
        searchKeys={["name"]}
        rowKey={(r) => Number(r.id)}
        emptyState={
          <EmptyState
            icon={Handshake}
            title="Aucun partenaire"
            description="Ajoutez un premier partenaire pour l'afficher dans le pied de page du site."
          />
        }
        rowActions={(row) => [
          {
            label: "Modifier",
            icon: Pencil,
            onSelect: () => openEdit(row as unknown as Partner),
          },
          {
            label: "Supprimer",
            icon: Trash2,
            destructive: true,
            onSelect: () => setDeleteId(Number(row.id)),
          },
        ]}
      />

      <SlideOverEditor
        open={editorOpen}
        title={editId ? `Modifier — ${editing?.name ?? ""}` : "Nouveau partenaire"}
        fields={FIELDS}
        initialValues={
          editing
            ? {
                name: editing.name,
                website: editing.website ?? "",
                logo_url: editing.logo_url ?? "",
                description: editing.description ?? "",
              }
            : {}
        }
        onClose={() => {
          setEditorOpen(false);
          setEditId(null);
        }}
        onSubmit={handleSubmit}
        onDelete={
          editId
            ? () => {
                setEditorOpen(false);
                setDeleteId(editId);
              }
            : undefined
        }
        preview={(v) => (
          <div className="flex items-center gap-3">
            {v.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={String(v.logo_url)} alt="" className="h-10 w-auto max-w-[120px] object-contain" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-admin-ctrl bg-admin-bg text-xs text-admin-muted">
                logo
              </span>
            )}
            <span className="font-display text-sm font-semibold text-admin-ink">
              {String(v.name || "Partenaire")}
            </span>
          </div>
        )}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Supprimer ce partenaire ?"
        message="Action définitive."
        destructive
        onConfirm={async () => {
          if (deleteId) {
            await fetch(`/api/admin/partners?id=${deleteId}`, { method: "DELETE" });
            success("Partenaire supprimé");
            load();
          }
          setDeleteId(null);
        }}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
