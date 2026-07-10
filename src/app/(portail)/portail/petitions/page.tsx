import type { Metadata } from "next";
import Link from "next/link";
import { getActivePetitionsCached } from "@/infrastructure/cache/petitions-cache";
import { PortalPage, PortalEmpty } from "@/components/portail/PortalPage";

export const metadata: Metadata = { title: "Portail — Pétitions" };

export default async function PortailPetitionsPage() {
  const petitions = await getActivePetitionsCached();

  return (
    <PortalPage title="Pétitions" subtitle="Soutenez les campagnes en cours pour les familles militaires.">
      {petitions.length === 0 ? (
        <PortalEmpty>Aucune pétition active pour le moment.</PortalEmpty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {petitions.map((p) => {
            const progress = Math.min(100, Math.round((p.signatures_count / p.goal) * 100));
            return (
              <article key={p.slug} className="flex flex-col border border-site-hairline bg-white p-6">
                <h3 className="font-serif text-lg font-medium text-site-ink">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-[1.6] text-site-muted">{p.description}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-site-muted-2">
                    <span className="font-semibold text-site-ink">
                      {p.signatures_count} signatures
                    </span>
                    <span>Objectif : {p.goal}</span>
                  </div>
                  <div className="mt-1.5 h-2 bg-site-surface">
                    <div className="h-2 bg-site-primary" style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <Link
                  href={`/petitions/${p.slug}`}
                  className="mt-5 self-start bg-site-primary px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-site-primary-dark"
                  data-cta="cta_petition"
                >
                  Signer la pétition
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </PortalPage>
  );
}
