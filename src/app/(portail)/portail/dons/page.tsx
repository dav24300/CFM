import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberDashboard } from "@/application/services/member.service";
import { PortalPage, PortalStatusPill, PortalEmpty } from "@/components/portail/PortalPage";

export const metadata: Metadata = { title: "Portail — Dons & reçus" };

const PROVIDER_LABELS: Record<string, string> = {
  orange: "Orange Money",
  mpesa: "M-Pesa",
  airtel: "Airtel Money",
};

export default async function PortailDonsPage() {
  const data = await getMemberDashboard();
  if (!data) redirect("/membre/connexion");

  const total = data.donations
    .filter((d) => d.status === "completed")
    .reduce((sum, d) => sum + Number(d.amount || 0), 0);

  return (
    <PortalPage
      title="Dons & reçus"
      subtitle="Historique de vos contributions à CFM."
      action={
        <Link
          href="/s-engager#don"
          className="bg-site-primary px-[18px] py-2.5 text-sm font-semibold text-white transition hover:bg-site-primary-dark"
          data-cta="cta_don"
        >
          Faire un don
        </Link>
      }
    >
      {data.donations.length === 0 ? (
        <PortalEmpty>Vous n’avez pas encore fait de don.</PortalEmpty>
      ) : (
        <>
          {total > 0 && (
            <div className="mb-5 border border-site-hairline bg-white p-5">
              <div className="text-xs font-medium uppercase tracking-[0.05em] text-site-muted-2">
                Total confirmé
              </div>
              <div className="mt-1 font-serif text-2xl font-medium text-site-primary">
                {total.toLocaleString("fr-FR")} USD
              </div>
            </div>
          )}
          <div className="overflow-hidden border border-site-hairline bg-white">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-site-hairline bg-site-surface text-xs uppercase text-site-muted-2">
                <tr>
                  <th className="px-4 py-3 font-semibold">Montant</th>
                  <th className="px-4 py-3 font-semibold">Moyen</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.donations.map((d) => (
                  <tr key={d.id} className="border-b border-site-hairline last:border-0">
                    <td className="px-4 py-3 font-semibold text-site-ink">
                      {Number(d.amount).toLocaleString("fr-FR")} {d.currency}
                    </td>
                    <td className="px-4 py-3 text-site-muted">
                      {PROVIDER_LABELS[d.provider] ?? d.provider}
                    </td>
                    <td className="px-4 py-3">
                      <PortalStatusPill status={d.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PortalPage>
  );
}
