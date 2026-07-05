"use client";

import { useState } from "react";
import { PROVINCES_RDC } from "@/lib/constants";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useAdminApi } from "@/components/admin/hooks/useAdminApi";
import type { AdminData } from "@/components/admin/types";

type Row = Record<string, unknown>;
type Props = { data: AdminData; onReload: () => void };

export function TerritoryPanel({ data, onReload }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const { post } = useAdminApi(onReload);

  const columns: Column<Row>[] = [
    { key: "province", header: "Province", sortable: true },
    { key: "title", header: "Titre", sortable: true },
    { key: "type", header: "Type" },
    { key: "date", header: "Date", sortable: true },
  ];

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await post({
      action: "create",
      table: "actions",
      data: {
        province: String(fd.get("province")),
        title: String(fd.get("title")),
        description: String(fd.get("description") || ""),
        date: String(fd.get("date") || ""),
        type: String(fd.get("type") || "action"),
      },
    });
    setShowForm(false);
    e.currentTarget.reset();
  }

  const actions = (data.actions || []) as Row[];
  const coveredProvinces = new Set(actions.map((a) => String(a.province)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-cfm-navy">Actions & territoire</h2>
        <Button type="button" size="sm" onClick={() => setShowForm(!showForm)}>
          + Action
        </Button>
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold uppercase text-cfm-earth">
          Couverture RDC — {coveredProvinces.size}/{PROVINCES_RDC.length} provinces
        </h3>
        <div className="flex flex-wrap gap-1">
          {PROVINCES_RDC.map((p) => (
            <span
              key={p}
              className={`rounded px-2 py-0.5 text-xs ${
                coveredProvinces.has(p)
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {p}
            </span>
          ))}
        </div>
        <a href="/actions" className="mt-3 inline-block text-sm text-blue-600 hover:underline" target="_blank" rel="noreferrer">
          Voir la carte publique →
        </a>
      </section>

      {showForm && (
        <form onSubmit={handleCreate} className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-2">
          <NativeSelect name="province" required className="text-sm">
            {PROVINCES_RDC.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </NativeSelect>
          <Input name="title" placeholder="Titre" required />
          <Input name="date" type="date" />
          <NativeSelect name="type" className="text-sm">
            <option value="action">Action</option>
            <option value="atelier">Atelier</option>
            <option value="plaidoyer">Plaidoyer</option>
          </NativeSelect>
          <Textarea name="description" placeholder="Description" className="md:col-span-2" rows={2} />
          <Button type="submit" size="sm" className="w-fit">Enregistrer</Button>
        </form>
      )}

      <DataTable
        data={actions}
        columns={columns}
        searchKeys={["province", "title"]}
        rowKey={(r) => Number(r.id)}
        actions={(row) => (
          <Button size="sm" variant="destructive" type="button" onClick={() => setDeleteId(Number(row.id))}>
            Suppr.
          </Button>
        )}
      />

      <p className="text-sm text-cfm-earth">
        {data.actions.length} actions sur {PROVINCES_RDC.length} provinces RDC
      </p>

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
