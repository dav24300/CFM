"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Button } from "@/components/ui/primitives/button";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { SlideOverEditor, type EditorField } from "@/components/admin/ui/slide-over-editor";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import type { AdminData } from "@/components/admin/types";
import { PreviewButton } from "@/components/admin/ui/preview-button";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";

type ContentType = "news" | "studies" | "campaigns" | "press_releases" | "testimonials";
type Row = Record<string, unknown>;

const TABLES: { id: ContentType; label: string }[] = [
  { id: "news", label: "Actualités" },
  { id: "studies", label: "Études" },
  { id: "campaigns", label: "Campagnes" },
  { id: "press_releases", label: "Presse" },
  { id: "testimonials", label: "Témoignages" },
];

const API_BASE: Record<ContentType, string> = {
  news: "/api/admin/news",
  studies: "/api/admin/studies",
  campaigns: "/api/admin/campaigns",
  press_releases: "/api/admin/press-releases",
  testimonials: "/api/admin/testimonials",
};

// Config de champs par table — les noms correspondent aux clés d'API.
const FIELDS_BY_TABLE: Record<ContentType, EditorField[]> = {
  news: [
    { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
    { name: "slug", label: "Slug", type: "text", colSpan: 1, placeholder: "optionnel" },
    { name: "category", label: "Catégorie", type: "text", colSpan: 1, placeholder: "actualite" },
    { name: "excerpt", label: "Extrait", type: "textarea", colSpan: 2, rows: 2 },
    { name: "content", label: "Contenu", type: "textarea", required: true, colSpan: 2, rows: 6 },
    { name: "cover_image", label: "Couverture", type: "image", colSpan: 2 },
    { name: "cover_image_alt", label: "Texte alternatif", type: "text", colSpan: 2 },
  ],
  studies: [
    { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
    { name: "slug", label: "Slug", type: "text", colSpan: 1, placeholder: "optionnel" },
    { name: "summary", label: "Résumé", type: "text", colSpan: 1 },
    { name: "content", label: "Contenu", type: "textarea", required: true, colSpan: 2, rows: 6 },
    { name: "file_url", label: "Fichier PDF", type: "image", colSpan: 2 },
  ],
  campaigns: [
    { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
    { name: "slug", label: "Slug", type: "text", colSpan: 1, placeholder: "optionnel" },
    { name: "petition_slug", label: "Slug pétition liée", type: "text", colSpan: 1 },
    { name: "description", label: "Description", type: "textarea", required: true, colSpan: 2, rows: 5 },
    { name: "image_url", label: "Image campagne", type: "image", colSpan: 2 },
  ],
  press_releases: [
    { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
    { name: "slug", label: "Slug", type: "text", colSpan: 1, placeholder: "optionnel" },
    { name: "content", label: "Contenu", type: "textarea", required: true, colSpan: 2, rows: 6 },
    { name: "file_url", label: "Fichier PDF", type: "image", colSpan: 2 },
  ],
  testimonials: [
    { name: "author", label: "Auteur", type: "text", colSpan: 1 },
    { name: "role", label: "Rôle", type: "text", colSpan: 1 },
    { name: "content", label: "Témoignage", type: "textarea", required: true, colSpan: 2, rows: 4 },
    { name: "photo", label: "Photo", type: "image", colSpan: 2 },
    { name: "anonymous", label: "Anonyme", type: "toggle", colSpan: 2 },
  ],
};

function tagForTable(table: ContentType): string {
  const map: Record<ContentType, string> = {
    news: CACHE_TAGS.news,
    studies: CACHE_TAGS.studies,
    campaigns: CACHE_TAGS.campaigns,
    press_releases: CACHE_TAGS.press,
    testimonials: CACHE_TAGS.testimonials,
  };
  return map[table];
}

type Props = { data: AdminData; onReload: () => void };

export function ContentPanel({ data, onReload }: Props) {
  const [table, setTable] = useState<ContentType>("news");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { success, error } = useAdminToast();

  const rows = (data[table] || []) as Row[];
  const publishKey = table === "campaigns" ? "active" : "published";
  const fields = FIELDS_BY_TABLE[table];
  const editing = editId ? rows.find((r) => Number(r.id) === editId) ?? null : null;

  const columns: Column<Row>[] = [
    { key: "title", header: "Titre", sortable: true, render: (r) => String(r.title || r.author || "—") },
    { key: "slug", header: "Slug" },
    { key: publishKey, header: "Publié", render: (r) => (Number(r[publishKey]) === 1 ? "Oui" : "Non") },
    { key: "created_at", header: "Date", sortable: true },
  ];

  async function apiRequest(method: string, path: string, body?: Record<string, unknown>) {
    const res = await fetch(path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    return res.ok;
  }

  function initialValues(): Record<string, unknown> {
    if (!editing) return {};
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      out[f.name] = f.type === "toggle" ? Number(editing[f.name]) === 1 : editing[f.name] ?? "";
    }
    return out;
  }

  async function handleSubmit(values: Record<string, unknown>) {
    const payload: Record<string, unknown> = { ...values };
    if ("anonymous" in payload) payload.anonymous = payload.anonymous ? 1 : 0;
    const base = API_BASE[table];
    const ok = editId
      ? await apiRequest("PATCH", `${base}/${editId}`, payload)
      : await apiRequest("POST", base, payload);
    if (!ok) {
      error("Échec enregistrement");
      return;
    }
    success(editId ? "Contenu mis à jour" : "Contenu créé");
    setEditorOpen(false);
    setEditId(null);
    onReload();
  }

  async function togglePublish(row: Row) {
    const id = Number(row.id);
    const next = Number(row[publishKey]) === 1 ? 0 : 1;
    const ok = await apiRequest("PATCH", `${API_BASE[table]}/${id}`, { [publishKey]: next });
    if (!ok) {
      error("Échec publication");
      return;
    }
    success(next === 1 ? "Publié" : "Dépublié");
    onReload();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const ok = await apiRequest("DELETE", `${API_BASE[table]}/${deleteId}`);
    if (!ok) {
      error("Échec suppression");
      return;
    }
    success("Supprimé");
    setDeleteId(null);
    onReload();
  }

  const tableLabel = TABLES.find((t) => t.id === table)?.label ?? "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-admin-ink">Contenu</h2>
        <div className="flex gap-2">
          <PreviewButton
            href={table === "news" ? "/" : table === "studies" || table === "campaigns" ? "/plaidoyer" : table === "press_releases" ? "/presse" : "/"}
            tags={[CACHE_TAGS.content, tagForTable(table)]}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditId(null);
              setEditorOpen(true);
            }}
          >
            + Nouveau
          </Button>
        </div>
      </div>

      <Tabs value={table} onValueChange={(v) => setTable(v as ContentType)}>
        <TabsList>
          {TABLES.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.label} ({(data[t.id] || []).length})
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <DataTable
        data={rows}
        columns={columns}
        searchKeys={["title", "slug"]}
        rowKey={(r) => Number(r.id)}
        actions={(row) => (
          <div className="flex flex-wrap gap-1">
            <Button size="sm" variant="secondary" type="button" onClick={() => togglePublish(row)}>
              {Number(row[publishKey]) === 1 ? "Dépublier" : "Publier"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => {
                setEditId(Number(row.id));
                setEditorOpen(true);
              }}
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
        title={editId ? `Modifier — ${tableLabel}` : `Nouveau — ${tableLabel}`}
        fields={fields}
        initialValues={initialValues()}
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
          <div>
            <div className="mb-1 inline-flex bg-admin-info-bg px-2 py-0.5 text-[11px] font-semibold uppercase text-admin-info-fg">
              {tableLabel}
            </div>
            <div className="font-display text-sm font-semibold text-admin-ink">
              {String(v.title || v.author || "Sans titre")}
            </div>
            {(v.excerpt || v.description || v.content) ? (
              <p className="mt-1 line-clamp-2 text-xs text-admin-muted">
                {String(v.excerpt || v.description || v.content || "")}
              </p>
            ) : null}
          </div>
        )}
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Supprimer définitivement ?"
        message="Cette action est irréversible."
        destructive
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
