"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { ExportButton } from "@/components/admin/ui/export-button";
import { PreviewButton } from "@/components/admin/ui/preview-button";
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
  const [txnById, setTxnById] = useState<Record<number, string>>({});

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
    {
      key: "donor_name",
      header: "Donateur",
      render: (r) => String(r.donor_name || "—"),
    },
    {
      key: "transaction_id",
      header: "Réf. PayDunya",
      render: (r) => String(r.transaction_id || "—"),
    },
    { key: "status", header: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
    { key: "created_at", header: "Date", sortable: true },
  ];

  async function reconcile(id: number, status: "completed" | "failed") {
    const transaction_id =
      txnById[id]?.trim() ||
      (status === "completed" ? `MANUAL-${id}-${Date.now()}` : null);
    const res = await fetch(`/api/admin/donations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        transaction_id,
        send_receipt: status === "completed",
      }),
    });
    if (!res.ok) {
      error("Échec mise à jour");
      return;
    }
    success(status === "completed" ? "Don validé et réconcilié" : "Don marqué échoué");
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
  const pendingCount = donations.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-admin-ink">Dons & transparence</h2>
          <p className="text-sm text-admin-muted">
            Total validé : <strong>{totalCompleted.toLocaleString("fr-FR")} CDF/USD</strong>
            {pendingCount > 0 && (
              <span className="ml-2 text-amber-700">· {pendingCount} en attente</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PreviewButton href="/s-engager" tags={[]} label="Voir transparence" />
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
        searchKeys={["phone", "provider", "donor_name", "transaction_id"]}
        rowKey={(r) => Number(r.id)}
        actions={(row) => {
          const id = Number(row.id);
          if (row.status !== "pending") return null;
          return (
            <div className="flex min-w-[220px] flex-col gap-2">
              <Input
                placeholder="Réf. transaction PayDunya…"
                className="text-xs"
                value={txnById[id] || ""}
                onChange={(e) => setTxnById((prev) => ({ ...prev, [id]: e.target.value }))}
              />
              <div className="flex gap-1">
                <Button size="sm" type="button" onClick={() => reconcile(id, "completed")}>
                  Valider
                </Button>
                <Button size="sm" variant="destructive" type="button" onClick={() => reconcile(id, "failed")}>
                  Échoué
                </Button>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
