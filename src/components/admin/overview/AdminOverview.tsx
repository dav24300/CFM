"use client";

import { useEffect, useState } from "react";
import { LifeBuoy, UserPlus, HandCoins, Users, History } from "lucide-react";
import type { AdminStats } from "@/components/admin/types";
import { cn } from "@/lib/utils/cn";
import { ExportButton } from "@/components/admin/ui/export-button";
import { PageHeader } from "@/components/admin/ui/PageHeader";
import { Card, CardHeader } from "@/components/admin/ui/card";
import { StatCard } from "@/components/admin/ui/StatCard";
import { AreaChart } from "@/components/admin/ui/charts/AreaChart";
import { Donut } from "@/components/admin/ui/charts/Donut";
import { EmptyState } from "@/components/admin/ui/EmptyState";
import { Skeleton } from "@/components/ui/primitives/skeleton";

type Props = { stats: AdminStats };

type Serie = { date: string; count: number }[];
type ActivitySeries = { help: Serie; memberships: Serie; donations: Serie };
type AuditEntry = { timestamp: string; action: string; endpoint: string; actorType: string };

const nf = (n: number) => n.toLocaleString("fr-FR");

/** Dérive sparkline + delta (2ᵉ moitié vs 1ʳᵉ) + total d'une série journalière. */
function serieStats(s?: Serie) {
  if (!s || !s.length) return { spark: undefined as number[] | undefined, delta: undefined as number | undefined, total: 0 };
  const counts = s.map((d) => d.count);
  const total = counts.reduce((a, b) => a + b, 0);
  const mid = Math.floor(counts.length / 2);
  const prior = counts.slice(0, mid).reduce((a, b) => a + b, 0);
  const recent = counts.slice(mid).reduce((a, b) => a + b, 0);
  const delta = prior > 0 ? ((recent - prior) / prior) * 100 : recent > 0 ? 100 : 0;
  return { spark: counts, delta, total };
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
      .then((d) => setAudit((d.entries || d.log || []).slice(0, 6)))
      .catch(() => {});
  }, []);

  const help = serieStats(activity?.help);
  const memb = serieStats(activity?.memberships);
  const dons = serieStats(activity?.donations);

  const chartData = (activity?.help ?? []).map((d, i) => ({
    label: d.date.slice(5),
    value: d.count + (activity?.memberships[i]?.count || 0) + (activity?.donations[i]?.count || 0),
  }));

  const contentTotal = stats.news + stats.studies + stats.campaigns;

  const alerts = [
    { label: "Aide — nouveaux dossiers", value: stats.new_help },
    { label: "Adhésions en attente", value: stats.pending_memberships },
    { label: "Membres à activer", value: stats.pending_users || 0 },
    { label: "Messages contact", value: stats.contacts },
    { label: "Signatures (24 h)", value: stats.new_petition_signatures || 0 },
    { label: "Chat à modérer", value: stats.pending_chat || 0 },
  ];

  const community = [
    { label: "Membres", value: stats.users || 0 },
    { label: "Dons", value: stats.donations || 0 },
    { label: "Pétitions", value: stats.petitions || 0 },
    { label: "Lives", value: stats.live_events || 0 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vue d'ensemble"
        subtitle="Activité, contenu et éléments à traiter — 7 derniers jours."
        actions={
          <>
            <ExportButton entity="newsletter" label="Newsletter" />
            <ExportButton entity="donations" label="Dons" />
            <ExportButton entity="memberships" label="Adhésions" />
          </>
        }
      />

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Demandes d'aide (7 j)" value={help.total} delta={help.delta} spark={help.spark} icon={LifeBuoy} format={nf} />
        <StatCard label="Adhésions (7 j)" value={memb.total} delta={memb.delta} spark={memb.spark} icon={UserPlus} format={nf} />
        <StatCard label="Dons (7 j)" value={dons.total} delta={dons.delta} spark={dons.spark} icon={HandCoins} format={nf} />
        <StatCard label="Membres" value={stats.users || 0} icon={Users} format={nf} />
      </div>

      {/* Activité + répartition */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <CardHeader title="Activité" subtitle="Aide + adhésions + dons par jour" />
          <div className="mt-5">
            {activity ? (
              chartData.length > 1 ? (
                <AreaChart data={chartData} valueFormat={(n) => `${n} évén.`} />
              ) : (
                <p className="py-16 text-center text-sm text-admin-muted">{"Pas encore d'activité sur la période."}</p>
              )
            ) : (
              <Skeleton className="h-[220px] w-full rounded-admin-ctrl" />
            )}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Répartition du contenu" />
          <div className="mt-6">
            {contentTotal > 0 ? (
              <Donut
                centerLabel={nf(contentTotal)}
                segments={[
                  { label: "Actualités", value: stats.news, colorClass: "stroke-admin-accent" },
                  { label: "Études", value: stats.studies, colorClass: "stroke-admin-info-fg" },
                  { label: "Campagnes", value: stats.campaigns, colorClass: "stroke-admin-ok-fg" },
                ]}
              />
            ) : (
              <p className="py-12 text-center text-sm text-admin-muted">Aucun contenu publié.</p>
            )}
          </div>
        </Card>
      </div>

      {/* À traiter */}
      <Card className="p-5">
        <CardHeader title="À traiter" subtitle="Éléments nécessitant une action" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {alerts.map((a) => {
            const on = a.value > 0;
            return (
              <div
                key={a.label}
                className={cn(
                  "rounded-admin-ctrl border p-3.5",
                  on ? "border-admin-danger-fg/25 bg-admin-danger-bg" : "border-admin-border bg-admin-bg"
                )}
              >
                <div className={cn("font-display text-2xl font-bold leading-none", on ? "text-admin-danger-fg" : "text-admin-ink")}>
                  {a.value}
                </div>
                <div className="mt-1.5 text-[11.5px] leading-tight text-admin-muted">{a.label}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Journal + communauté */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <CardHeader title="Journal récent" subtitle="Dernières actions d'administration" />
          <div className="mt-4">
            {audit.length > 0 ? (
              <ul className="divide-y divide-admin-border">
                {audit.map((entry, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-[13px]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-admin-accent/10 text-admin-accent">
                      <History className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      <span className="font-medium text-admin-ink">{entry.action}</span>{" "}
                      <span className="text-admin-muted-2">{entry.endpoint}</span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-admin-muted-2">
                      {entry.timestamp?.slice(0, 16).replace("T", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={History} title="Aucune activité récente" description="Les actions d'administration apparaîtront ici." />
            )}
          </div>
        </Card>

        <Card className="p-5">
          <CardHeader title="Communauté" />
          <dl className="mt-4 divide-y divide-admin-border">
            {community.map((c) => (
              <div key={c.label} className="flex items-center justify-between py-2.5">
                <dt className="text-[13px] text-admin-muted">{c.label}</dt>
                <dd className="font-display text-lg font-bold text-admin-ink">{nf(c.value)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </div>
  );
}
