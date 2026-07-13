"use client";

import { useState } from "react";
import { Eye, Pencil, Trash2, Download } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/ui/data-table";
import { SlideOverEditor, type EditorField } from "@/components/admin/ui/slide-over-editor";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { StatCard } from "@/components/admin/ui/StatCard";
import { StatusBadge } from "@/components/admin/ui/status-badge";
import { Button } from "@/components/ui/primitives/button";

type Row = { id: number; name: string; email: string; status: string; amount: number };

const ROWS: Row[] = [
  { id: 1, name: "Awa Mbuyi", email: "awa@example.cd", status: "active", amount: 45 },
  { id: 2, name: "Jean Kalala", email: "jean@example.cd", status: "pending", amount: 20 },
  { id: 3, name: "Sarah Nkulu", email: "sarah@example.cd", status: "active", amount: 120 },
  { id: 4, name: "Patrick Ilunga", email: "patrick@example.cd", status: "suspended", amount: 0 },
  { id: 5, name: "Grace Tshala", email: "grace@example.cd", status: "active", amount: 75 },
  { id: 6, name: "David Kabeya", email: "david@example.cd", status: "pending", amount: 30 },
];

const COLUMNS: Column<Row>[] = [
  { key: "name", header: "Nom", sortable: true },
  { key: "email", header: "Email" },
  { key: "status", header: "Statut", render: (r) => <StatusBadge status={String(r.status)} /> },
  { key: "amount", header: "Montant", sortable: true, render: (r) => `${r.amount} $` },
];

const FIELDS: EditorField[] = [
  { name: "name", label: "Nom", type: "text", required: true, colSpan: 2 },
  { name: "email", label: "Email", type: "url", placeholder: "nom@example.cd" },
  {
    name: "role",
    label: "Rôle",
    type: "select",
    options: [
      { value: "member", label: "Membre" },
      { value: "volunteer", label: "Bénévole" },
    ],
  },
  { name: "province", label: "Province", type: "province" },
  { name: "active", label: "Compte actif", type: "toggle" },
  { name: "bio", label: "Biographie", type: "textarea", colSpan: 2, help: "Optionnel." },
];

export function ShowcaseIsland() {
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active">("all");

  const rows = filter === "active" ? ROWS.filter((r) => r.status === "active") : ROWS;

  return (
    <div className="space-y-6">
      {/* StatCards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Membres" value={1284} delta={12.4} spark={[8, 12, 9, 14, 13, 18, 21]} />
        <StatCard label="Dons (7 j)" value={4260} format={(n) => `${n} $`} delta={-4.2} spark={[40, 38, 42, 30, 28, 33, 26]} />
        <StatCard label="En attente" value={7} delta={0} />
      </div>

      {/* DataTable — toutes fonctions premium */}
      <DataTable
        data={rows}
        columns={COLUMNS}
        searchKeys={["name", "email"]}
        rowKey={(r) => r.id}
        loading={loading}
        title="Membres"
        description="Démo — recherche, tri, filtres, sélection groupée, menu kebab, squelette."
        filterChips={[
          { label: "Tous", active: filter === "all", onClick: () => setFilter("all"), count: ROWS.length },
          { label: "Actifs", active: filter === "active", onClick: () => setFilter("active") },
        ]}
        toolbar={
          <Button size="sm" variant="secondary" onClick={() => setLoading((l) => !l)}>
            {loading ? "Arrêter" : "Simuler chargement"}
          </Button>
        }
        selectable
        bulkActions={(sel) => (
          <>
            <Button size="sm" variant="secondary">
              Exporter ({sel.length})
            </Button>
            <Button size="sm" variant="destructive">
              Supprimer
            </Button>
          </>
        )}
        rowActions={(r) => [
          { label: "Voir", icon: Eye, onSelect: () => {} },
          { label: "Modifier", icon: Pencil, onSelect: () => setEditorOpen(true) },
          {
            label: "Export CSV",
            icon: Download,
            href: `data:text/csv;charset=utf-8,${encodeURIComponent(`nom,email\n${r.name},${r.email}`)}`,
            download: true,
          },
          { label: "Supprimer", icon: Trash2, destructive: true, onSelect: () => setConfirmOpen(true) },
        ]}
      />

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setEditorOpen(true)}>
          Ouvrir le slide-over
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
          Ouvrir le confirm
        </Button>
      </div>

      <SlideOverEditor
        open={editorOpen}
        title="Éditer un membre (démo)"
        fields={FIELDS}
        initialValues={{ name: "Awa Mbuyi", active: true }}
        onClose={() => setEditorOpen(false)}
        onSubmit={() => setEditorOpen(false)}
        onDelete={() => {
          setEditorOpen(false);
          setConfirmOpen(true);
        }}
        preview={(v) => (
          <span className="font-display text-sm font-semibold text-admin-ink">
            {String(v.name || "—")}
          </span>
        )}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer ce membre ?"
        message="Action de démonstration — irréversible dans un cas réel."
        destructive
        confirmLabel="Supprimer"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
