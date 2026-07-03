"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { ExportButton } from "@/components/admin/ui/export-button";
import { useAdminApi } from "@/components/admin/hooks/useAdminApi";
import type { AdminData } from "@/components/admin/types";

type Row = Record<string, unknown>;
type Props = { data: AdminData; onReload: () => void };

export function CommunityPanel({ data, onReload }: Props) {
  const [tab, setTab] = useState<"users" | "family" | "petitions" | "newsletter">("users");
  const [showPetition, setShowPetition] = useState(false);
  const { post } = useAdminApi(onReload);

  const users = (data.users || []) as Row[];
  const family = (data.family_links || []) as Row[];
  const petitions = (data.petitions || []) as Row[];

  const userCols: Column<Row>[] = [
    { key: "first_name", header: "Prénom", sortable: true },
    { key: "last_name", header: "Nom" },
    { key: "email", header: "Email" },
    { key: "membership_type", header: "Type" },
    { key: "status", header: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
  ];

  const familyCols: Column<Row>[] = [
    {
      key: "parent",
      header: "Parent",
      render: (r) => {
        const p = r.parent as { first_name?: string; last_name?: string } | undefined;
        return p ? `${p.first_name} ${p.last_name}` : "—";
      },
    },
    {
      key: "child",
      header: "Enfant",
      render: (r) => {
        const c = r.child as { first_name?: string; last_name?: string } | undefined;
        return c ? `${c.first_name} ${c.last_name}` : "—";
      },
    },
    { key: "relationship", header: "Lien" },
    { key: "status", header: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
  ];

  const petitionCols: Column<Row>[] = [
    { key: "title", header: "Titre", sortable: true },
    { key: "signatures", header: "Signatures", render: (r) => String(r.signatures ?? r.signatures_count ?? 0) },
    { key: "goal", header: "Objectif" },
  ];

  const newsletterCols: Column<Row>[] = [
    { key: "email", header: "Email", sortable: true },
    { key: "created_at", header: "Inscrit le", sortable: true },
  ];

  async function createPetition(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await post({
      action: "create",
      table: "petitions",
      data: {
        title: String(fd.get("title")),
        description: String(fd.get("description")),
        content: String(fd.get("content") || ""),
        goal: String(fd.get("goal") || "100"),
      },
    });
    setShowPetition(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-cfm-navy">Communauté</h2>
        <ExportButton entity="newsletter" />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="users">Membres ({users.length})</TabsTrigger>
          <TabsTrigger value="family">Familles ({family.length})</TabsTrigger>
          <TabsTrigger value="petitions">Pétitions ({petitions.length})</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter ({data.newsletter.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "users" && (
        <DataTable
          data={users}
          columns={userCols}
          searchKeys={["first_name", "last_name", "email"]}
          rowKey={(r) => Number(r.id)}
          actions={(row) => (
            <div className="flex gap-1">
              {row.status === "pending" && (
                <Button size="sm" type="button" onClick={() => post({ action: "activate_user", id: row.id })}>
                  Activer
                </Button>
              )}
              {row.status === "active" && (
                <Button size="sm" variant="destructive" type="button" onClick={() => post({ action: "suspend_user", id: row.id })}>
                  Suspendre
                </Button>
              )}
            </div>
          )}
        />
      )}

      {tab === "family" && (
        <DataTable
          data={family}
          columns={familyCols}
          rowKey={(r) => Number(r.id)}
          actions={(row) =>
            row.status !== "approved" && row.status !== "rejected" ? (
              <div className="flex gap-1">
                <Button size="sm" type="button" onClick={() => post({ action: "approve_family_link", id: row.id })}>
                  Approuver
                </Button>
                <Button size="sm" variant="destructive" type="button" onClick={() => post({ action: "reject_family_link", id: row.id })}>
                  Refuser
                </Button>
              </div>
            ) : null
          }
        />
      )}

      {tab === "petitions" && (
        <>
          <Button type="button" size="sm" onClick={() => setShowPetition(!showPetition)}>+ Pétition</Button>
          {showPetition && (
            <form onSubmit={createPetition} className="space-y-2 rounded-xl border bg-white p-4">
              <Input name="title" placeholder="Titre" required />
              <Textarea name="description" placeholder="Description" required rows={2} />
              <Input name="goal" type="number" placeholder="Objectif signatures" defaultValue={100} />
              <Button type="submit" size="sm">Créer</Button>
            </form>
          )}
          <DataTable data={petitions} columns={petitionCols} rowKey={(r) => Number(r.id)} />
        </>
      )}

      {tab === "newsletter" && (
        <DataTable
          data={data.newsletter as Row[]}
          columns={newsletterCols}
          searchKeys={["email"]}
          rowKey={(r) => Number(r.id)}
        />
      )}
    </div>
  );
}
