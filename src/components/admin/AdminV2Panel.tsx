"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";

type UserRow = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  membership_type: string;
  status: string;
  role: string;
};

type FamilyLink = {
  id: number;
  status: string;
  relationship: string;
  parent?: { first_name: string; last_name: string };
  child?: { first_name: string; last_name: string };
};

type Donation = {
  id: number;
  amount: number;
  currency: string;
  provider: string;
  status: string;
  phone: string;
  created_at: string;
};

type Petition = {
  id: number;
  title: string;
  slug: string;
  signatures_count: number;
  goal: number;
  signatures?: number;
};

type Props = {
  users: UserRow[];
  familyLinks: FamilyLink[];
  donations: Donation[];
  petitions: Petition[];
  onReload: () => void;
  isAdmin: boolean;
};

export function AdminV2Panel({
  users,
  familyLinks,
  donations,
  petitions,
  onReload,
  isAdmin,
}: Props) {
  const [showPetitionForm, setShowPetitionForm] = useState(false);

  async function activateUser(id: number) {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "activate_user", id }),
    });
    onReload();
  }

  async function approveLink(id: number) {
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve_family_link", id }),
    });
    onReload();
  }

  async function createPetition(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table: "petitions",
        action: "create",
        data: Object.fromEntries(fd.entries()),
      }),
    });
    setShowPetitionForm(false);
    onReload();
  }

  async function exportPetitionCsv(id: number, slug: string) {
    const res = await fetch(`/api/admin/export/petitions/${id}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cfm-petition-${slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 space-y-10">
      <section>
        <h2 className="text-lg font-bold">Comptes membres ({users.length})</h2>
        <div className="mt-4 space-y-2">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">Aucun compte</p>
          ) : (
            users.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 shadow text-sm">
                <div>
                  <strong>{u.first_name} {u.last_name}</strong> — {u.email}
                  <span className="ml-2 text-gray-500">{u.membership_type} / {u.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {u.status}
                  </span>
                  {u.status === "pending" && (
                    <button type="button" onClick={() => activateUser(u.id)} className="rounded bg-cfm-navy px-2 py-1 text-xs text-white">
                      Activer
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Liens familiaux ({familyLinks.length})</h2>
        <div className="mt-4 space-y-2">
          {familyLinks.map((l) => (
            <div key={l.id} className="flex flex-wrap justify-between gap-2 rounded-lg bg-white p-3 shadow text-sm">
              <span>
                {l.parent?.first_name} {l.parent?.last_name} → {l.child?.first_name} {l.child?.last_name}
                ({l.relationship})
              </span>
              <div className="flex items-center gap-2">
                <span className="text-cfm-gold">{l.status}</span>
                {l.status !== "approved" && l.status !== "rejected" && (
                  <button type="button" onClick={() => approveLink(l.id)} className="rounded bg-green-600 px-2 py-1 text-xs text-white">
                    Approuver (admin)
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">Dons Mobile Money ({donations.length})</h2>
        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Montant</th>
                <th className="px-4 py-2 text-left">Opérateur</th>
                <th className="px-4 py-2 text-left">Tél</th>
                <th className="px-4 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="px-4 py-2">{d.amount} {d.currency}</td>
                  <td className="px-4 py-2">{d.provider}</td>
                  <td className="px-4 py-2">{d.phone}</td>
                  <td className="px-4 py-2 text-cfm-gold">{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Pétitions ({petitions.length})</h2>
            <button type="button" onClick={() => setShowPetitionForm(!showPetitionForm)} className="rounded-lg bg-cfm-gold px-3 py-1 text-sm font-semibold text-cfm-navy">
              + Nouvelle pétition
            </button>
          </div>
          {showPetitionForm && (
            <form onSubmit={createPetition} className="mt-4 space-y-3 rounded-xl bg-white p-4 shadow">
              <Input name="title" placeholder="Titre" required />
              <Textarea name="description" placeholder="Description" required rows={2} />
              <Input name="goal" type="number" placeholder="Objectif signatures" defaultValue={100} />
              <Button type="submit" size="sm">Créer</Button>
            </form>
          )}
          <div className="mt-4 space-y-2">
            {petitions.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 shadow text-sm">
                <div>
                  <strong>{p.title}</strong>
                  <span className="ml-2 text-gray-500">
                    {p.signatures_count}/{p.goal} signatures
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportPetitionCsv(p.id, p.slug)}
                  className="rounded bg-cfm-navy px-2 py-1 text-xs text-white"
                >
                  Export CSV
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
