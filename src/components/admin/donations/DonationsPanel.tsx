"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { ExportButton } from "@/components/admin/ui/export-button";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import type { AdminData } from "@/components/admin/types";

type Row = Record<string, unknown>;
type Props = { data: AdminData; onReload: () => void };

export function DonationsPanel({ data, onReload }: Props) {
  const donations = (data.donations || []) as Row[];
  const { success, error } = useAdminToast();
  const [filter, setFilter] = useState("all");
  const [donorsPublic, setDonorsPublic] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setDonorsPublic(d.settings?.donors_public === "1"))
      .catch(() => {});
  }, []);

  const filtered =
    filter === "all" ? donations : donations.filter((d) => d.status === filter);

  const columns: Column<Row>[] = [
    { key: "amount", header: "Montant", render: (r) => `${r.amount} ${r.currency}` },
    { key: "provider", header: "Opérateur" },
    { key: "phone", header: "Téléphone" },
    { key: "status", header: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
    { key: "created_at", header: "Date", sortable: true },
  ];

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/admin/donations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      error("Échec mise à jour");
      return;
    }
    success("Don mis à jour");
    onReload();
  }

  async function toggleDonorsPublic() {
    setSavingPublic(true);
    const next = !donorsPublic;
    const res = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: { donors_public: next ? "1" : "0" } }),
    });
    setSavingPublic(false);
    if (!res.ok) {
      error("Échec enregistrement");
      return;
    }
    setDonorsPublic(next);
    success(next ? "Liste donateurs visible sur le site" : "Liste donateurs masquée");
  }

  const totalCompleted = donations
    .filter((d) => d.status === "completed")
    .reduce((s, d) => s + Number(d.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-cfm-navy">Dons & transparence</h2>
          <p className="text-sm text-cfm-earth">
            Total validé : <strong>{totalCompleted.toLocaleString("fr-FR")} CDF</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={donorsPublic ? "primary" : "secondary"}
            loading={savingPublic}
            onClick={toggleDonorsPublic}
          >
            {donorsPublic ? "Masquer liste publique" : "Afficher liste publique"}
          </Button>
          <ExportButton entity="donations" />
        </div>
      </div>

      <NativeSelect value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48 text-sm">
        <option value="all">Tous les statuts</option>
        <option value="pending">En attente</option>
        <option value="completed">Validés</option>
        <option value="failed">Échoués</option>
      </NativeSelect>

      <DataTable
        data={filtered}
        columns={columns}
        searchKeys={["phone", "provider"]}
        rowKey={(r) => Number(r.id)}
        actions={(row) => (
          <div className="flex gap-1">
            {row.status === "pending" && (
              <>
                <Button size="sm" type="button" onClick={() => updateStatus(Number(row.id), "completed")}>
                  Valider
                </Button>
                <Button size="sm" variant="destructive" type="button" onClick={() => updateStatus(Number(row.id), "failed")}>
                  Échoué
                </Button>
              </>
            )}
          </div>
        )}
      />
    </div>
  );
}
