"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { useAdminApi } from "@/components/admin/hooks/useAdminApi";
import type { AdminData } from "@/components/admin/types";

type ContentType = "news" | "studies" | "campaigns" | "press_releases" | "testimonials";
type Row = Record<string, unknown>;

const TABLES: { id: ContentType; label: string }[] = [
  { id: "news", label: "Actualités" },
  { id: "studies", label: "Études" },
  { id: "campaigns", label: "Campagnes" },
  { id: "press_releases", label: "Presse" },
  { id: "testimonials", label: "Témoignages" },
];

type Props = { data: AdminData; onReload: () => void };

export function ContentPanel({ data, onReload }: Props) {
  const [table, setTable] = useState<ContentType>("news");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { post } = useAdminApi(onReload);
  const { success, error } = useAdminToast();

  const rows = (data[table] || []) as Row[];

  const columns: Column<Row>[] = [
    { key: "title", header: "Titre", sortable: true, render: (r) => String(r.title || r.author || "—") },
    { key: "slug", header: "Slug" },
    { key: "created_at", header: "Date", sortable: true },
  ];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => {
      payload[k] = String(v);
    });

    if (editId && table === "news") {
      const res = await fetch(`/api/admin/news/${editId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        error("Échec mise à jour");
        return;
      }
      success("Actualité mise à jour");
    } else if (editId) {
      await post({ action: "update_content", table, id: editId, data: payload });
    } else {
      await post({ action: "create", table, data: payload });
    }
    setShowForm(false);
    setEditId(null);
    onReload();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    if (table === "news") {
      await fetch(`/api/admin/news/${deleteId}`, { method: "DELETE" });
    } else {
      await post({ action: "delete", table, id: deleteId });
    }
    setDeleteId(null);
    onReload();
  }

  const editing = editId ? rows.find((r) => Number(r.id) === editId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-cfm-navy">Contenu</h2>
        <Button type="button" size="sm" onClick={() => { setShowForm(true); setEditId(null); }}>
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
            </>
          ) : (
            <>
              <Input name="author" placeholder="Auteur" defaultValue={String(editing?.author || "")} />
              <Input name="role" placeholder="Rôle" defaultValue={String(editing?.role || "")} />
              <Textarea name="content" placeholder="Témoignage" required rows={3} defaultValue={String(editing?.content || "")} />
            </>
          )}
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
          <div className="flex gap-1">
            <Button size="sm" variant="secondary" type="button" onClick={() => { setEditId(Number(row.id)); setShowForm(false); }}>
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
    </div>
  );
}
