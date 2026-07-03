"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { useAdminApi } from "@/components/admin/hooks/useAdminApi";
import type { AdminData } from "@/components/admin/types";

type Row = Record<string, unknown>;

type Props = {
  data: AdminData;
  onReload: () => void;
};

export function InboxPanel({ data, onReload }: Props) {
  const { post } = useAdminApi(onReload);
  const [subTab, setSubTab] = useState<"help" | "contact" | "memberships">("help");
  const [helpNote, setHelpNote] = useState<Record<number, string>>({});

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
    { key: "created_at", header: "Date", sortable: true },
  ];

  const memberCols: Column<Row>[] = [
    { key: "first_name", header: "Prénom", sortable: true },
    { key: "last_name", header: "Nom" },
    { key: "email", header: "Email" },
    { key: "status", header: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl font-bold text-cfm-navy">Boîte de réception</h2>
      <Tabs value={subTab} onValueChange={(v) => setSubTab(v as typeof subTab)}>
        <TabsList>
          <TabsTrigger value="help">Aide ({data.help_requests.length})</TabsTrigger>
          <TabsTrigger value="contact">Contact ({data.contacts.length})</TabsTrigger>
          <TabsTrigger value="memberships">Adhésions ({data.memberships.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {subTab === "help" && (
        <DataTable
          data={data.help_requests as Row[]}
          columns={helpCols}
          searchKeys={["first_name", "email"]}
          rowKey={(r) => Number(r.id)}
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
          data={data.contacts as Row[]}
          columns={contactCols}
          searchKeys={["name", "email", "subject"]}
          rowKey={(r) => Number(r.id)}
        />
      )}

      {subTab === "memberships" && (
        <DataTable
          data={data.memberships as Row[]}
          columns={memberCols}
          searchKeys={["first_name", "last_name", "email"]}
          rowKey={(r) => Number(r.id)}
          actions={(row) => (
            <div className="flex gap-1">
              {row.status === "pending" && (
                <>
                  <Button
                    size="sm"
                    type="button"
                    onClick={() =>
                      post({ action: "update_status", table: "memberships", id: row.id, data: { status: "approved" } })
                    }
                  >
                    Approuver
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    type="button"
                    onClick={() => post({ action: "reject_membership", id: row.id })}
                  >
                    Refuser
                  </Button>
                </>
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}
