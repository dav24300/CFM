"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/primitives/tabs";
import { Button } from "@/components/ui/primitives/button";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { ExportButton } from "@/components/admin/ui/export-button";
import { PreviewButton } from "@/components/admin/ui/preview-button";
import { SlideOverEditor, type EditorField } from "@/components/admin/ui/slide-over-editor";
import { useAdminApi } from "@/components/admin/hooks/useAdminApi";
import { useAdminToast } from "@/components/admin/context/AdminToastContext";
import type { AdminData } from "@/components/admin/types";

type Row = Record<string, unknown>;
type Props = { data: AdminData; onReload: () => void };

const PETITION_FIELDS: EditorField[] = [
  { name: "title", label: "Titre", type: "text", required: true, colSpan: 2 },
  { name: "slug", label: "Slug", type: "text", colSpan: 1, placeholder: "auto si vide" },
  { name: "goal", label: "Objectif signatures", type: "number", colSpan: 1 },
  { name: "description", label: "Description", type: "textarea", required: true, colSpan: 2, rows: 2 },
  { name: "content", label: "Contenu détaillé", type: "textarea", colSpan: 2, rows: 3 },
];

export function CommunityPanel({ data, onReload }: Props) {
  const [tab, setTab] = useState<"users" | "family" | "petitions" | "newsletter">("users");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const { post } = useAdminApi(onReload);
  const { success, error } = useAdminToast();

  const users = (data.users || []) as Row[];
  const family = (data.family_links || []) as Row[];
  const petitions = (data.petitions || []) as Row[];
  const editingPetition = editId ? petitions.find((p) => Number(p.id) === editId) ?? null : null;

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
    { key: "slug", header: "Slug" },
    {
      key: "active",
      header: "Statut",
      render: (r) => (
        <StatusBadge status={r.active === 1 || r.active === undefined ? "active" : "inactive"} />
      ),
    },
    { key: "signatures", header: "Signatures", render: (r) => String(r.signatures ?? r.signatures_count ?? 0) },
    { key: "goal", header: "Objectif" },
  ];

  const newsletterCols: Column<Row>[] = [
    { key: "email", header: "Email", sortable: true },
    { key: "created_at", header: "Inscrit le", sortable: true },
  ];

  async function petitionRequest(path: string, method: string, body?: Record<string, unknown>) {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      error(d.error || "Action refusée");
      return false;
    }
    success("Action enregistrée");
    onReload();
    return true;
  }

  async function handlePetitionSubmit(values: Record<string, unknown>) {
    const goal = Number(values.goal) || 100;
    const ok = editId
      ? await petitionRequest(`/api/admin/petitions/${editId}`, "PATCH", {
          title: String(values.title || ""),
          slug: String(values.slug || ""),
          description: String(values.description || ""),
          content: String(values.content || ""),
          goal,
        })
      : await petitionRequest("/api/admin/petitions", "POST", {
          title: String(values.title || ""),
          description: String(values.description || ""),
          content: String(values.content || ""),
          goal,
        });
    if (ok) {
      setEditorOpen(false);
      setEditId(null);
    }
  }

  async function togglePetition(id: number, active: number) {
    await petitionRequest(`/api/admin/petitions/${id}`, "PATCH", { active: active === 1 ? 0 : 1 });
  }

  async function removePetition(id: number) {
    if (!confirm("Supprimer cette pétition ?")) return;
    await petitionRequest(`/api/admin/petitions/${id}`, "DELETE");
  }

  async function removeNewsletter(id: number) {
    if (!confirm("Retirer cet abonné de la newsletter ?")) return;
    const res = await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" });
    if (!res.ok) {
      error("Échec suppression");
      return;
    }
    success("Abonné retiré");
    onReload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-semibold text-admin-ink">Communauté</h2>
        <div className="flex gap-2">
          {tab === "users" && <ExportButton entity="users" label="Exporter membres" />}
          {tab === "newsletter" && <ExportButton entity="newsletter" />}
          {tab === "petitions" && <PreviewButton href="/petitions" tags={["cfm:petitions"]} />}
        </div>
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
          <Button type="button" size="sm" onClick={() => { setEditId(null); setEditorOpen(true); }}>
            + Pétition
          </Button>
          <DataTable
            data={petitions}
            columns={petitionCols}
            searchKeys={["title", "slug"]}
            rowKey={(r) => Number(r.id)}
            actions={(row) => {
              const id = Number(row.id);
              const active = row.active === 1 || row.active === undefined ? 1 : 0;
              return (
                <div className="flex flex-wrap gap-1">
                  <Button size="sm" variant="secondary" type="button" onClick={() => { setEditId(id); setEditorOpen(true); }}>
                    Modifier
                  </Button>
                  <Button size="sm" variant="secondary" type="button" onClick={() => togglePetition(id, active)}>
                    {active === 1 ? "Dépublier" : "Publier"}
                  </Button>
                  <a
                    href={`/api/admin/export/petitions/${id}`}
                    download
                    className="inline-flex h-8 items-center rounded-admin-ctrl border border-admin-border bg-admin-surface px-3 text-xs font-medium hover:bg-admin-bg"
                  >
                    Signatures CSV
                  </a>
                  <Button size="sm" variant="destructive" type="button" onClick={() => removePetition(id)}>
                    Supprimer
                  </Button>
                </div>
              );
            }}
          />
        </>
      )}

      {tab === "newsletter" && (
        <DataTable
          data={data.newsletter as Row[]}
          columns={newsletterCols}
          searchKeys={["email"]}
          rowKey={(r) => Number(r.id)}
          actions={(row) => (
            <Button size="sm" variant="destructive" type="button" onClick={() => removeNewsletter(Number(row.id))}>
              Retirer
            </Button>
          )}
        />
      )}

      <SlideOverEditor
        open={editorOpen}
        title={editId ? "Modifier la pétition" : "Nouvelle pétition"}
        fields={PETITION_FIELDS}
        initialValues={
          editingPetition
            ? {
                title: editingPetition.title ?? "",
                slug: editingPetition.slug ?? "",
                goal: Number(editingPetition.goal) || 100,
                description: editingPetition.description ?? "",
                content: editingPetition.content ?? "",
              }
            : { goal: 100 }
        }
        onClose={() => { setEditorOpen(false); setEditId(null); }}
        onSubmit={handlePetitionSubmit}
        preview={(v) => (
          <div>
            <div className="font-display text-sm font-semibold text-admin-ink">
              {String(v.title || "Nouvelle pétition")}
            </div>
            <div className="mt-1 text-xs text-admin-muted">Objectif : {String(v.goal || 100)} signatures</div>
          </div>
        )}
      />
    </div>
  );
}
