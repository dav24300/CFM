import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { getCoordinationStats } from "@/infrastructure/repositories/coordination.repository";
import { PortalPage, PortalStatusPill, PortalEmpty } from "@/components/portail/PortalPage";

export const metadata: Metadata = { title: "Portail — Coordination" };

const NEED_LABELS: Record<string, string> = {
  aide: "Aide générale",
  medical: "Santé",
  education: "Éducation",
  juridique: "Juridique",
  financier: "Financier",
  autre: "Autre",
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PortailCoordinationPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/membre/connexion");

  const province = member.province ?? undefined;
  const stats = await getCoordinationStats(province);
  const scopeLabel = stats.province ?? "toutes provinces";

  const kpis = [
    { label: "Familles suivies", value: stats.familiesFollowed, tone: "primary" as const },
    { label: "Demandes à traiter", value: stats.requestsToTreat, tone: "warn" as const },
    { label: "Événements à venir", value: stats.upcomingEvents, tone: "primary" as const },
  ];

  return (
    <PortalPage
      title="Coordination"
      subtitle={`Pilotez l’activité de votre province : demandes à traiter, familles suivies et événements — ${scopeLabel}.`}
    >
      <section aria-label="Indicateurs" className="grid gap-3.5 sm:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="border border-site-hairline bg-white p-5">
            <div
              className={
                "font-serif text-[30px] font-medium leading-none " +
                (kpi.tone === "warn" ? "text-admin-warn-fg" : "text-site-primary")
              }
            >
              {kpi.value}
            </div>
            <div className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.05em] text-site-muted-2">
              {kpi.label}
            </div>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-medium text-site-ink">
            Demandes récentes
          </h2>
          {stats.requestsToTreat > 0 && (
            <span className="bg-admin-warn-bg px-2.5 py-1 text-[11px] font-bold text-admin-warn-fg">
              {stats.requestsToTreat} en attente
            </span>
          )}
        </div>

        {stats.recentRequests.length === 0 ? (
          <PortalEmpty>Aucune demande récente pour {scopeLabel}.</PortalEmpty>
        ) : (
          <div className="border border-site-hairline bg-white">
            {stats.recentRequests.map((req, i) => (
              <div
                key={req.id}
                className={
                  "flex items-start justify-between gap-4 px-5 py-4 " +
                  (i > 0 ? "border-t border-site-hairline" : "")
                }
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-site-ink">
                    {NEED_LABELS[req.need_type] ?? req.need_type}
                  </div>
                  {req.description && (
                    <p className="mt-1 line-clamp-2 text-[13px] leading-[1.5] text-site-muted">
                      {req.description}
                    </p>
                  )}
                  <div className="mt-1.5 text-xs text-site-muted-2">
                    {req.province || "Province non précisée"} · reçue le {formatDate(req.created_at)}
                  </div>
                </div>
                <PortalStatusPill status={req.status} />
              </div>
            ))}
          </div>
        )}
      </section>
    </PortalPage>
  );
}
