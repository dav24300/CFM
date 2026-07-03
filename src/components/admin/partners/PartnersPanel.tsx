"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";

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
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { success, error } = useAdminToast();

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

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/partners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        website: fd.get("website"),
        logo_url: fd.get("logo_url"),
        description: fd.get("description"),
      }),
    });
    if (!res.ok) {
      error("Échec création");
      return;
    }
    success("Partenaire ajouté");
    setShowForm(false);
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
        <Button type="button" size="sm" onClick={() => setShowForm(!showForm)}>+ Partenaire</Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
          <Input name="name" placeholder="Nom" required />
          <Input name="website" placeholder="https://…" />
          <Input name="logo_url" placeholder="URL logo" className="md:col-span-2" />
          <Textarea name="description" placeholder="Description" className="md:col-span-2" rows={2} />
          <Button type="submit" size="sm" className="w-fit">Enregistrer</Button>
        </form>
      )}

      <DataTable
        data={partners as unknown as Record<string, unknown>[]}
        columns={columns as Column<Record<string, unknown>>[]}
        searchKeys={["name"]}
        rowKey={(r) => Number(r.id)}
        actions={(row) => (
          <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteId(Number(row.id))}>
            Suppr.
          </Button>
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
