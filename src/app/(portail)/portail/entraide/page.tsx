import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { getOpenHelpRequests } from "@/infrastructure/repositories/entraide.repository";
import { PortalPage, PortalEmpty } from "@/components/portail/PortalPage";
import { ClaimButton } from "@/components/portail/ClaimButton";

export const metadata: Metadata = { title: "Portail — Entraide" };

const NEED_LABELS: Record<string, string> = {
  aide: "Aide générale",
  medical: "Santé",
  education: "Éducation",
  juridique: "Juridique",
  financier: "Financier",
  logement: "Logement",
  autre: "Autre",
};

function needLabel(needType: string | null): string {
  if (!needType) return "Demande d’aide";
  return NEED_LABELS[needType] ?? needType;
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PortailEntraidePage() {
  const member = await getCurrentMember();
  if (!member) redirect("/membre/connexion");

  const missions = await getOpenHelpRequests();

  return (
    <PortalPage
      title="Entraide"
      subtitle="Missions bénévoles à pourvoir et échanges entre familles — espace modéré par l’équipe CFM."
    >
      <div className="flex items-center gap-2.5 border border-site-hairline bg-site-pale px-4 py-3 text-[13px] leading-[1.5] text-site-primary">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0"
          aria-hidden="true"
        >
          <rect x="4" y="10" width="16" height="10" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
        Chaque mission et publication est vérifiée par un modérateur CFM pour
        protéger la communauté.
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-site-muted">
          Missions bénévoles à pourvoir ({missions.length})
        </h2>
        {missions.length === 0 ? (
          <PortalEmpty>
            Aucune mission ouverte pour le moment. Revenez bientôt.
          </PortalEmpty>
        ) : (
          <div className="flex flex-col gap-3">
            {missions.map((mission) => {
              const date = formatDate(mission.created_at);
              return (
                <article
                  key={mission.id}
                  className="flex flex-col gap-4 border border-site-hairline bg-white p-5 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.05em] text-site-primary">
                      <span>{needLabel(mission.need_type)}</span>
                      {mission.province && (
                        <span className="text-site-muted-2">
                          {mission.province}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-medium leading-snug text-site-ink">
                      Une famille a besoin de soutien — détails partagés en toute
                      confidentialité après acceptation de la mission.
                    </h3>
                    {date && (
                      <p className="mt-1.5 text-xs text-site-muted-2">
                        Publiée le {date}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 sm:pt-1">
                    <ClaimButton missionId={mission.id} />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PortalPage>
  );
}
