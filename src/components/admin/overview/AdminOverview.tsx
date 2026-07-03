"use client";

import type { AdminStats } from "@/components/admin/types";
import { ExportButton } from "@/components/admin/ui/export-button";

type Props = { stats: AdminStats };

function KpiCard({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        alert ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase text-cfm-earth">{label}</p>
      <p className="mt-1 text-2xl font-bold text-cfm-navy">{value}</p>
    </div>
  );
}

export function AdminOverview({ stats }: Props) {
  const v1Total = stats.news + stats.studies + stats.campaigns;
  const communityPending =
    (stats.pending_users || 0) + (stats.pending_memberships || 0) + (stats.pending_family_links || 0);
  const inboxPending = (stats.new_help || 0) + (stats.pending_memberships || 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-cfm-navy">Vue d&apos;ensemble</h2>
        <div className="flex flex-wrap gap-2">
          <ExportButton entity="newsletter" label="Newsletter CSV" />
          <ExportButton entity="donations" label="Dons CSV" />
          <ExportButton entity="memberships" label="Adhésions CSV" />
        </div>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-cfm-earth">Alertes</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Aide — nouveaux dossiers" value={stats.new_help} alert={stats.new_help > 0} />
          <KpiCard
            label="Adhésions en attente"
            value={stats.pending_memberships}
            alert={stats.pending_memberships > 0}
          />
          <KpiCard
            label="Membres à activer"
            value={stats.pending_users || 0}
            alert={(stats.pending_users || 0) > 0}
          />
          <KpiCard
            label="Messages contact"
            value={stats.contacts}
            alert={stats.contacts > 0}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-cfm-earth">V1 — Contenu & triage</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Actualités" value={stats.news} />
          <KpiCard label="Études" value={stats.studies} />
          <KpiCard label="Campagnes" value={stats.campaigns} />
          <KpiCard label="Contenu total" value={v1Total} />
          <KpiCard label="Newsletter" value={stats.newsletter} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-cfm-earth">V2 — Communauté</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Membres" value={stats.users || 0} />
          <KpiCard label="Dons" value={stats.donations || 0} />
          <KpiCard label="Pétitions" value={stats.petitions || 0} />
          <KpiCard label="En attente (communauté)" value={communityPending} alert={communityPending > 0} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-cfm-earth">V3 — Mobilisation</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Lives" value={stats.live_events || 0} />
          <KpiCard
            label="Chat à modérer"
            value={stats.pending_chat || 0}
            alert={(stats.pending_chat || 0) > 0}
          />
          <KpiCard label="Boîte réception" value={inboxPending} alert={inboxPending > 0} />
        </div>
      </section>
    </div>
  );
}
