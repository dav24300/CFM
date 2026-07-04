"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import { MediaPicker } from "@/components/admin/ui/media-picker";

type Partner = {
  id: number;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  sort_order: number;
};

export function PartnersPanel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [logoPath, setLogoPath] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const { success, error } = useAdminToast();

  const editing = editId ? partners.find((p) => p.id === editId) : null;

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

  function startEdit(partner: Partner) {
    setEditId(partner.id);
    setShowForm(false);
    setLogoPath(partner.logo_url || "");
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        website: fd.get("website"),
        logo_url: logoPath || fd.get("logo_url") || null,
        description: fd.get("description"),
      }),
    });
    if (!res.ok) {
      error("Échec création");
      return;
    }
    success("Partenaire ajouté");
    setShowForm(false);
    setLogoPath("");
    load();
  }

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editId) return;
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/partners", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editId,
        name: fd.get("name"),
        website: fd.get("website"),
        logo_url: logoPath || fd.get("logo_url") || null,
        description: fd.get("description"),
      }),
    });
    if (!res.ok) {
      error("Échec mise à jour");
      return;
    }
    success("Partenaire mis à jour");
    setEditId(null);
    setLogoPath("");
    load();
  }

  const columns: Column<Partner>[] = [
    { key: "name", header: "Nom", sortable: true },
    { key: "website", header: "Site" },
    { key: "sort_order", header: "Ordre" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-cfm-navy">Partenaires</h2>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setShowForm(!showForm);
            setEditId(null);
            setLogoPath("");
          }}
        >
          + Partenaire
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
          <Input name="name" placeholder="Nom" required />
          <Input name="website" placeholder="https://…" />
          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <Input name="logo_url" placeholder="URL logo (optionnel)" className="flex-1" />
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowPicker(true)}>
              Choisir logo
            </Button>
            {logoPath && <code className="max-w-xs truncate text-xs">{logoPath}</code>}
          </div>
          <Textarea name="description" placeholder="Description" className="md:col-span-2" rows={2} />
          <Button type="submit" size="sm" className="w-fit">Enregistrer</Button>
        </form>
      )}

      {editId && editing && (
        <form onSubmit={handleUpdate} className="grid gap-3 rounded-xl border border-cfm-gold bg-white p-4 md:grid-cols-2">
          <h3 className="font-semibold md:col-span-2">Modifier — {editing.name}</h3>
          <Input name="name" placeholder="Nom" required defaultValue={editing.name} />
          <Input name="website" placeholder="https://…" defaultValue={editing.website || ""} />
          <div className="flex flex-wrap items-center gap-2 md:col-span-2">
            <Input
              name="logo_url"
              placeholder="URL logo"
              className="flex-1"
              defaultValue={editing.logo_url || ""}
            />
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowPicker(true)}>
              Choisir logo
            </Button>
            {logoPath && <code className="max-w-xs truncate text-xs">{logoPath}</code>}
          </div>
          <Textarea
            name="description"
            placeholder="Description"
            className="md:col-span-2"
            rows={2}
            defaultValue={editing.description || ""}
          />
          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" size="sm">Mettre à jour</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setEditId(null); setLogoPath(""); }}>
              Annuler
            </Button>
          </div>
        </form>
      )}

      <DataTable
        data={partners as unknown as Record<string, unknown>[]}
        columns={columns as Column<Record<string, unknown>>[]}
        searchKeys={["name"]}
        rowKey={(r) => Number(r.id)}
        actions={(row) => (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => startEdit(row as unknown as Partner)}
            >
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

      {showPicker && (
        <MediaPicker
          open
          onClose={() => setShowPicker(false)}
          onSelect={(path) => {
            setLogoPath(path);
            setShowPicker(false);
          }}
          title="Logo partenaire"
          accept="image/*"
        />
      )}
    </div>
  );
}
