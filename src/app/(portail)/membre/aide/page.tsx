import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getMemberDashboard } from "@/application/services/member.service";
import { HelpRequestForm } from "@/components/HelpRequestForm";
import { PortalPage, PortalStatusPill, PortalEmpty } from "@/components/portail/PortalPage";

export const metadata: Metadata = { title: "Portail — Mes demandes d'aide" };

const NEED_LABELS: Record<string, string> = {
  aide: "Aide générale",
  medical: "Santé",
  education: "Éducation",
  juridique: "Juridique",
  financier: "Financier",
  autre: "Autre",
};

export default async function PortailAidePage() {
  const data = await getMemberDashboard();
  if (!data) redirect("/membre/connexion");

  return (
    <PortalPage
      title="Mes demandes d'aide"
      subtitle="Suivez vos dossiers et déposez une nouvelle demande — traitée en toute confidentialité."
    >
      <section>
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-site-muted">
          Mes dossiers ({data.helpRequests.length})
        </h2>
        {data.helpRequests.length === 0 ? (
          <PortalEmpty>Vous n’avez pas encore de demande d’aide.</PortalEmpty>
        ) : (
          <div className="flex flex-col gap-3">
            {data.helpRequests.map((h) => (
              <article key={h.id} className="border border-site-hairline bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-lg font-medium text-site-ink">
                    {NEED_LABELS[h.need_type] ?? h.need_type}
                  </h3>
                  <PortalStatusPill status={h.status} />
                </div>
                {h.description && (
                  <p className="mt-2 text-sm leading-[1.6] text-site-muted">{h.description}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-site-muted">
          Nouvelle demande
        </h2>
        <div className="max-w-2xl border border-site-hairline bg-white p-6">
          <HelpRequestForm />
        </div>
      </section>
    </PortalPage>
  );
}
