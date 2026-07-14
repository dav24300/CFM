"use client";

import { useEffect, useState } from "react";
import { ClipboardList } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { ExportButton } from "@/components/admin/ui/export-button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";

type Entry = {
  timestamp: string;
  actorType: string;
  action: string;
  endpoint: string;
  target?: string | null;
  status: string;
};

export function AuditPanel() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((d) => setEntries(d.entries || []));
  }, []);

  const columns: Column<Entry>[] = [
    { key: "timestamp", header: "Date", sortable: true, render: (r) => new Date(r.timestamp).toLocaleString("fr-FR") },
    { key: "actorType", header: "Acteur" },
    { key: "action", header: "Action", sortable: true },
    { key: "target", header: "Cible" },
    { key: "status", header: "Statut", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal & exports"
        subtitle="Historique des actions administratives et exports de données au format CSV."
        actions={
          <>
            <ExportButton entity="help_requests" label="Aide CSV" />
            <ExportButton entity="contacts" label="Contacts CSV" />
            <ExportButton entity="memberships" label="Adhésions CSV" />
            <ExportButton entity="news" label="Actualités CSV" />
          </>
        }
      />

      <DataTable
        data={entries as unknown as Record<string, unknown>[]}
        columns={columns as Column<Record<string, unknown>>[]}
        searchKeys={["action", "target", "actorType"]}
        rowKey={(r) => String(r.timestamp) + String(r.action)}
        pageSize={15}
        emptyMessage="Aucune entrée d'audit"
        emptyState={
          <EmptyState
            icon={ClipboardList}
            title="Aucune entrée d'audit"
            description="Les actions administratives et les exports apparaîtront ici au fil de l'activité."
          />
        }
      />
    </div>
  );
}
