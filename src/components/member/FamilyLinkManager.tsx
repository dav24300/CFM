"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/primitives/input";
import { NativeSelect } from "@/components/ui/primitives/native-select";
import { Button } from "@/components/ui/primitives/button";
import { Alert } from "@/components/ui/primitives/alert";
import { FormField } from "@/components/ui/patterns/form-field";
import { EmptyState } from "@/components/ui/patterns/empty-state";

type LinkItem = {
  id: number;
  parent_user_id: number;
  child_user_id: number;
  relationship: string;
  status: string;
  initiated_by: string;
  parent?: { first_name: string; last_name: string; email: string };
  child?: { first_name: string; last_name: string; email: string };
};

export function FamilyLinkManager() {
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [mode, setMode] = useState<"parent" | "child" | null>(null);
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("enfant");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    fetch("/api/member/family")
      .then((r) => r.json())
      .then((d) => setLinks(d.links || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(action: string) {
    setMessage("");
    setError("");
    const res = await fetch("/api/member/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action,
        child_email: action === "parent_invite" ? email : undefined,
        parent_email: action === "child_request" ? email : undefined,
        relationship,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Erreur");
      return;
    }
    setMessage("Demande envoyée avec succès");
    setEmail("");
    setMode(null);
    load();
  }

  async function respond(linkId: number, approve: boolean) {
    await fetch("/api/member/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "respond", link_id: linkId, approve }),
    });
    load();
  }

  const statusLabel: Record<string, string> = {
    pending_child: "En attente de l'enfant",
    pending_parent: "En attente du parent",
    pending_admin: "En attente admin",
    approved: "Approuvé",
    rejected: "Refusé",
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => setMode("parent")}>
          Ajouter un enfant à charge
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setMode("child")}>
          Identifier mon parent
        </Button>
      </div>

      {mode && (
        <div className="space-y-3 rounded-lg border border-site-primary/30 bg-site-surface p-4">
          <p className="text-sm font-medium">
            {mode === "parent" ? "Email de l'enfant (compte CFM requis)" : "Email du parent"}
          </p>
          <FormField label="Email" htmlFor="family_email" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
            />
          </FormField>
          <FormField label="Lien familial" htmlFor="family_relationship">
            <NativeSelect
              id="family_relationship"
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
            >
              <option value="enfant">Enfant</option>
              <option value="conjoint">Conjoint(e)</option>
              <option value="orphelin">Orphelin</option>
            </NativeSelect>
          </FormField>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => submit(mode === "parent" ? "parent_invite" : "child_request")}
            >
              Envoyer
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setMode(null)}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {links.length === 0 ? (
        <EmptyState variant="compact" title="Aucun lien familial enregistré" />
      ) : (
        <ul className="space-y-2">
          {links.map((link) => (
            <li key={link.id} className="rounded-lg border p-3 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span>
                  {link.parent?.first_name} {link.parent?.last_name}
                  {" → "}
                  {link.child?.first_name} {link.child?.last_name}
                  <span className="ml-2 text-site-muted">({link.relationship})</span>
                </span>
                <span className="font-semibold text-site-primary">
                  {statusLabel[link.status] || link.status}
                </span>
              </div>
              {(link.status === "pending_child" || link.status === "pending_parent") && (
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => respond(link.id, true)}
                  >
                    Approuver
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => respond(link.id, false)}
                  >
                    Refuser
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
