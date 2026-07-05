"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import type { AdminData } from "@/components/admin/types";
import { MediaPicker } from "@/components/admin/ui/media-picker";

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

type Props = { data: AdminData; onReload: () => void };

export function ContentPanel({ data, onReload }: Props) {
  const [table, setTable] = useState<ContentType>("news");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [mediaPath, setMediaPath] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { success, error } = useAdminToast();

  const rows = (data[table] || []) as Row[];

  const publishKey = table === "campaigns" ? "active" : "published";

  const columns: Column<Row>[] = [
    { key: "title", header: "Titre", sortable: true, render: (r) => String(r.title || r.author || "—") },
    { key: "slug", header: "Slug" },
    {
      key: publishKey,
      header: "Publié",
      render: (r) => (Number(r[publishKey]) === 1 ? "Oui" : "Non"),
    },
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => {
      payload[k] = String(v);
    });
    if (mediaPath) {
      if (table === "news") payload.cover_image = mediaPath;
      else if (table === "campaigns") payload.image_url = mediaPath;
      else if (table === "testimonials") payload.photo = mediaPath;
      else if (table === "studies" || table === "press_releases") payload.file_url = mediaPath;
    }
    if (table === "campaigns" && fd.get("petition_slug")) {
      payload.petition_slug = String(fd.get("petition_slug"));
    }
    if (table === "testimonials" && fd.get("anonymous") === "on") {
      payload.anonymous = "1";
    }

    const base = API_BASE[table];
    const ok = editId
      ? await apiRequest("PATCH", `${base}/${editId}`, payload)
      : await apiRequest("POST", base, payload);

    if (!ok) {
      error("Échec enregistrement");
      return;
    }
    success(editId ? "Contenu mis à jour" : "Contenu créé");
    setShowForm(false);
    setEditId(null);
    setMediaPath("");
    onReload();
  }

  async function togglePublish(row: Row) {
    const id = Number(row.id);
    const current = Number(row[publishKey]) === 1 ? 1 : 0;
    const next = current === 1 ? 0 : 1;
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

  const editing = editId ? rows.find((r) => Number(r.id) === editId) : null;

  const mediaFieldLabel =
    table === "news"
      ? "Couverture"
      : table === "campaigns"
        ? "Image campagne"
        : table === "testimonials"
          ? "Photo"
          : "Fichier PDF";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-cfm-navy">Contenu</h2>
        <Button type="button" size="sm" onClick={() => { setShowForm(true); setEditId(null); setMediaPath(""); }}>
          + Nouveau
        </Button>
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

      {(showForm || editId) && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border bg-white p-4 shadow-sm">
          <h3 className="font-semibold">{editId ? "Modifier" : "Créer"}</h3>
          {table !== "testimonials" ? (
            <>
              <Input name="title" placeholder="Titre" required defaultValue={String(editing?.title || "")} />
              <Input name="slug" placeholder="Slug (optionnel)" defaultValue={String(editing?.slug || "")} />
              <Textarea name="content" placeholder="Contenu" required rows={4} defaultValue={String(editing?.content || editing?.description || "")} />
              {table === "news" && (
                <Input name="excerpt" placeholder="Extrait" defaultValue={String(editing?.excerpt || "")} />
              )}
              {table === "studies" && (
                <Input name="summary" placeholder="Résumé" defaultValue={String(editing?.summary || "")} />
              )}
              {table === "campaigns" && (
                <Input name="petition_slug" placeholder="Slug pétition liée" defaultValue={String(editing?.petition_slug || "")} />
              )}
            </>
          ) : (
            <>
              <Input name="author" placeholder="Auteur" defaultValue={String(editing?.author || "")} />
              <Input name="role" placeholder="Rôle" defaultValue={String(editing?.role || "")} />
              <Textarea name="content" placeholder="Témoignage" required rows={3} defaultValue={String(editing?.content || "")} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="anonymous" defaultChecked={Number(editing?.anonymous) === 1} />
                Anonyme
              </label>
            </>
          )}
          <div className="flex flex-wrap items-center gap-2 border-t pt-3">
            <span className="text-sm text-cfm-earth">{mediaFieldLabel} :</span>
            <code className="max-w-xs truncate text-xs">{mediaPath || String(editing?.cover_image || editing?.image_url || editing?.photo || editing?.file_url || "—")}</code>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowPicker(true)}>
              Choisir média
            </Button>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm">Enregistrer</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }}>
              Annuler
            </Button>
          </div>
        </form>
      )}

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
            <Button size="sm" variant="secondary" type="button" onClick={() => {
              setEditId(Number(row.id));
              setShowForm(false);
              const r = row as Row;
              setMediaPath(String(r.cover_image || r.image_url || r.photo || r.file_url || ""));
            }}>
              Éditer
            </Button>
            <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteId(Number(row.id))}>
              Suppr.
            </Button>
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

      {showPicker && (
        <MediaPicker
          open
          onClose={() => setShowPicker(false)}
          onSelect={(path) => {
            setMediaPath(path);
            setShowPicker(false);
          }}
          title={`Média — ${mediaFieldLabel}`}
          accept={table === "studies" || table === "press_releases" ? "application/pdf,image/*" : "image/*"}
        />
      )}
    </div>
  );
}
