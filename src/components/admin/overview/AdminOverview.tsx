"use client";

import { useEffect, useState } from "react";
import type { AdminStats } from "@/components/admin/types";
import { ExportButton } from "@/components/admin/ui/export-button";

type Props = { stats: AdminStats };

type ActivitySeries = {
  help: { date: string; count: number }[];
  memberships: { date: string; count: number }[];
  donations: { date: string; count: number }[];
};

type AuditEntry = {
  timestamp: string;
  action: string;
  endpoint: string;
  actorType: string;
};

function KpiCard({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        alert ? "border-red-200 bg-red-50" : "border-admin-border bg-admin-surface"
      }`}
    >
      <p className="text-xs font-medium uppercase text-admin-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-admin-ink">{value}</p>
    </div>
  );
}

function ActivityChart({ series }: { series: ActivitySeries }) {
  const days = series.help.map((d) => d.date.slice(5));
  const totals = days.map((_, i) =>
    (series.help[i]?.count || 0) +
    (series.memberships[i]?.count || 0) +
    (series.donations[i]?.count || 0)
  );
  const max = Math.max(...totals, 1);

  return (
    <div className="rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase text-admin-muted">Activité — 7 derniers jours</h3>
      <div className="flex h-32 items-end gap-2">
        {days.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t bg-admin-accent/80 transition-all"
              style={{ height: `${(totals[i] / max) * 100}%`, minHeight: totals[i] > 0 ? 4 : 0 }}
              title={`${totals[i]} événements`}
            />
            <span className="text-[10px] text-admin-muted">{label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-admin-muted">Aide + adhésions + dons par jour</p>
    </div>
  );
}

export function AdminOverview({ stats }: Props) {
  const [activity, setActivity] = useState<ActivitySeries | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  useEffect(() => {
    fetch("/api/admin/stats/activity")
      .then((r) => r.json())
      .then((d) => setActivity(d.series))
      .catch(() => {});
    fetch("/api/admin/audit")
      .then((r) => r.json())
      .then((d) => setAudit((d.entries || d.log || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const v1Total = stats.news + stats.studies + stats.campaigns;
  const communityPending =
    (stats.pending_users || 0) + (stats.pending_memberships || 0) + (stats.pending_family_links || 0);
  const inboxPending =
    (stats.new_help || 0) +
    (stats.pending_memberships || 0) +
    (stats.new_petition_signatures || 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-display text-xl font-bold text-admin-ink">Vue d&apos;ensemble</h2>
        <div className="flex flex-wrap gap-2">
          <ExportButton entity="newsletter" label="Newsletter CSV" />
          <ExportButton entity="donations" label="Dons CSV" />
          <ExportButton entity="memberships" label="Adhésions CSV" />
        </div>
      </div>

      {activity && <ActivityChart series={activity} />}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-admin-muted">Alertes</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Aide — nouveaux dossiers" value={stats.new_help} alert={stats.new_help > 0} />
          <KpiCard label="Adhésions en attente" value={stats.pending_memberships} alert={stats.pending_memberships > 0} />
          <KpiCard label="Membres à activer" value={stats.pending_users || 0} alert={(stats.pending_users || 0) > 0} />
          <KpiCard label="Messages contact" value={stats.contacts} alert={stats.contacts > 0} />
          <KpiCard
            label="Signatures pétitions (24h)"
            value={stats.new_petition_signatures || 0}
            alert={(stats.new_petition_signatures || 0) > 0}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-admin-muted">V1 — Contenu & triage</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KpiCard label="Actualités" value={stats.news} />
          <KpiCard label="Études" value={stats.studies} />
          <KpiCard label="Campagnes" value={stats.campaigns} />
          <KpiCard label="Contenu total" value={v1Total} />
          <KpiCard label="Newsletter" value={stats.newsletter} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-admin-muted">V2 — Communauté</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Membres" value={stats.users || 0} />
          <KpiCard label="Dons" value={stats.donations || 0} />
          <KpiCard label="Pétitions" value={stats.petitions || 0} />
          <KpiCard label="En attente (communauté)" value={communityPending} alert={communityPending > 0} />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase text-admin-muted">V3 — Mobilisation</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <KpiCard label="Lives" value={stats.live_events || 0} />
          <KpiCard label="Chat à modérer" value={stats.pending_chat || 0} alert={(stats.pending_chat || 0) > 0} />
          <KpiCard label="Boîte réception" value={inboxPending} alert={inboxPending > 0} />
        </div>
      </section>

      {audit.length > 0 && (
        <section className="rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold uppercase text-admin-muted">Journal récent</h3>
          <ul className="space-y-2 text-sm">
            {audit.map((entry, i) => (
              <li key={i} className="flex flex-wrap gap-2 text-admin-muted">
                <span className="text-xs text-admin-muted-2">{entry.timestamp?.slice(0, 16)}</span>
                <span className="font-medium text-admin-ink">{entry.action}</span>
                <span>{entry.endpoint}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
