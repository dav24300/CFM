"use client";

import { useState } from "react";
import { LifeBuoy, Mail, UserPlus, FileSignature, CheckCheck, Archive, Check, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { ExportButton } from "@/components/admin/ui/export-button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { useAdminApi } from "@/components/admin/hooks/useAdminApi";
import type { AdminData } from "@/components/admin/types";

type Row = Record<string, unknown>;

type Props = {
  data: AdminData;
  onReload: () => void;
};

export function InboxPanel({ data, onReload }: Props) {
  const { post } = useAdminApi(onReload);
  const [subTab, setSubTab] = useState<"help" | "contact" | "memberships" | "petitions">("help");
  const [helpNote, setHelpNote] = useState<Record<number, string>>({});

  const contacts = (data.contacts as Row[]).filter((c) => c.status !== "archived");
  const archivedCount = (data.contacts as Row[]).filter((c) => c.status === "archived").length;
  const petitionSignatures = (data.petition_signatures || []) as Row[];
  const newPetitionSignatures = petitionSignatures.filter((s) => Boolean(s.is_new)).length;

  const helpCols: Column<Row>[] = [
    { key: "first_name", header: "Nom", sortable: true },
    { key: "email", header: "Email" },
    { key: "status", header: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
    { key: "created_at", header: "Date", sortable: true },
  ];

  const contactCols: Column<Row>[] = [
    { key: "name", header: "Nom", sortable: true },
    { key: "email", header: "Email" },
    { key: "subject", header: "Sujet" },
    { key: "message", header: "Message", className: "max-w-xs truncate" },
    {
      key: "status",
      header: "Statut",
      render: (r) => <StatusBadge status={String(r.status || "new")} />,
    },
    { key: "created_at", header: "Date", sortable: true },
  ];

  const memberCols: Column<Row>[] = [
    { key: "first_name", header: "Prénom", sortable: true },
    { key: "last_name", header: "Nom" },
    { key: "email", header: "Email" },
    { key: "status", header: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
  ];
  const petitionCols: Column<Row>[] = [
    { key: "petition_title", header: "Pétition", sortable: true },
    { key: "name", header: "Signataire", sortable: true },
    { key: "email", header: "Email" },
    {
      key: "is_new",
      header: "Statut",
      render: (r) => (
        <StatusBadge status={Boolean(r.is_new) ? "new" : "read"} />
      ),
    },
    { key: "signed_at", header: "Signé le", sortable: true },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boîte de réception"
        subtitle="Demandes d'aide, messages de contact, adhésions et signatures de pétitions."
      />
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as typeof subTab)}>
        <TabsList>
          <TabsTrigger value="help">Aide ({data.help_requests.length})</TabsTrigger>
          <TabsTrigger value="contact">
            Contact ({contacts.length}{archivedCount ? ` · ${archivedCount} archivés` : ""})
          </TabsTrigger>
          <TabsTrigger value="memberships">Adhésions ({data.memberships.length})</TabsTrigger>
          <TabsTrigger value="petitions">
            Signatures pétitions ({petitionSignatures.length}
            {newPetitionSignatures ? ` · ${newPetitionSignatures} nouvelles` : ""})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {subTab === "help" && (
        <DataTable
          data={data.help_requests as Row[]}
          columns={helpCols}
          searchKeys={["first_name", "email"]}
          rowKey={(r) => Number(r.id)}
          emptyState={
            <EmptyState
              icon={LifeBuoy}
              title="Aucune demande d'aide"
              description="Les demandes d'aide envoyées depuis le site apparaîtront ici."
            />
          }
          actions={(row) => (
            <div className="flex flex-col gap-2 min-w-[200px]">
              <Input
                placeholder="Note interne…"
                className="text-xs"
                value={helpNote[Number(row.id)] || ""}
                onChange={(e) =>
                  setHelpNote((prev) => ({ ...prev, [Number(row.id)]: e.target.value }))
                }
              />
              <div className="flex flex-wrap gap-1">
                {["in_progress", "treated"].map((st) => (
                  <Button
                    key={st}
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() =>
                      post({
                        action: "help_update",
                        id: row.id,
                        data: { status: st, note: helpNote[Number(row.id)] || "" },
                      })
                    }
                  >
                    {st === "in_progress" ? "En cours" : "Traité"}
                  </Button>
                ))}
              </div>
            </div>
          )}
        />
      )}

      {subTab === "contact" && (
        <DataTable
          data={contacts}
          columns={contactCols}
          searchKeys={["name", "email", "subject"]}
          rowKey={(r) => Number(r.id)}
          toolbar={<ExportButton entity="contacts" label="Exporter contacts" />}
          emptyState={
            <EmptyState
              icon={Mail}
              title="Aucun message"
              description="Les messages envoyés via le formulaire de contact s'afficheront ici."
            />
          }
          rowActions={(row) => [
            {
              label: "Marquer lu",
              icon: CheckCheck,
              disabled: row.status === "read",
              onSelect: () => post({ action: "contact_update", id: row.id, data: { status: "read" } }),
            },
            {
              label: "Archiver",
              icon: Archive,
              destructive: true,
              onSelect: () => post({ action: "contact_update", id: row.id, data: { status: "archived" } }),
            },
          ]}
        />
      )}

      {subTab === "memberships" && (
        <DataTable
          data={data.memberships as Row[]}
          columns={memberCols}
          searchKeys={["first_name", "last_name", "email"]}
          rowKey={(r) => Number(r.id)}
          emptyState={
            <EmptyState
              icon={UserPlus}
              title="Aucune adhésion"
              description="Les demandes d'adhésion à traiter apparaîtront ici."
            />
          }
          rowActions={(row) =>
            row.status === "pending"
              ? [
                  {
                    label: "Approuver",
                    icon: Check,
                    onSelect: () =>
                      post({ action: "update_status", table: "memberships", id: row.id, data: { status: "approved" } }),
                  },
                  {
                    label: "Refuser",
                    icon: X,
                    destructive: true,
                    onSelect: () => post({ action: "reject_membership", id: row.id }),
                  },
                ]
              : []
          }
        />
      )}

      {subTab === "petitions" && (
        <DataTable
          data={petitionSignatures}
          columns={petitionCols}
          searchKeys={["petition_title", "name", "email"]}
          rowKey={(r) => Number(r.id)}
          toolbar={
            newPetitionSignatures > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => post({ action: "petition_signatures_mark_read" })}
              >
                Marquer toutes les signatures comme lues
              </Button>
            ) : undefined
          }
          emptyState={
            <EmptyState
              icon={FileSignature}
              title="Aucune signature"
              description="Les signatures de pétitions collectées s'afficheront ici."
            />
          }
        />
      )}
    </div>
  );
}
