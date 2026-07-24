import { getTranslationsFor } from "@/lib/i18n-server";
import { getSiteSetting } from "@/infrastructure/repositories/settings.repository";
import { getDonationTotalsCached } from "@/infrastructure/cache/public-page-cache";

export async function DonationTransparency() {
  const { t } = await getTranslationsFor("fr");
  const showDonorList = (await getSiteSetting("donors_public")) === "1";

  // Totaux agrégés une fois puis mis en cache : la table entière était
  // rechargée à chaque affichage de /s-engager pour en tirer trois nombres.
  const { count, totalUsd, totalCdf, recents } = await getDonationTotalsCached();

  const recentPublic = showDonorList
    ? recents.map((d) => ({
        id: d.id,
        label: d.donor_name?.trim() || "Donateur anonyme",
        amount: `${d.amount.toLocaleString("fr-FR")} ${d.currency}`,
        date: d.created_at.slice(0, 10),
      }))
    : [];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-site-surface p-4 text-center">
          <p className="text-2xl font-bold text-site-ink">{count}</p>
          <p className="text-sm text-site-muted">{t.common.donationsRecorded}</p>
        </div>
        <div className="rounded-lg bg-site-surface p-4 text-center">
          <p className="text-2xl font-bold text-site-ink">{totalUsd.toLocaleString("fr-FR")} USD</p>
          <p className="text-sm text-site-muted">{t.common.totalUsd}</p>
        </div>
        <div className="rounded-lg bg-site-surface p-4 text-center">
          <p className="text-2xl font-bold text-site-ink">{totalCdf.toLocaleString("fr-FR")} CDF</p>
          <p className="text-sm text-site-muted">{t.common.totalCdf}</p>
        </div>
      </div>

      {showDonorList && recentPublic.length > 0 && (
        <div className="rounded-lg border border-site-primary/20 bg-white p-4">
          <h3 className="mb-3 font-semibold text-site-ink">Derniers dons (anonymisés)</h3>
          <ul className="space-y-2 text-sm">
            {recentPublic.map((d) => (
              <li key={d.id} className="flex justify-between gap-4 border-b border-gray-50 pb-2 last:border-0">
                <span className="text-site-ink">{d.label}</span>
                <span className="text-site-muted">
                  {d.amount} · {d.date}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
