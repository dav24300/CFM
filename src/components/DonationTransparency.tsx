import { getAllDonations } from "@/lib/members";
import { getTranslations } from "@/lib/i18n-server";
import { getStoreAsync } from "@/lib/store";

export async function DonationTransparency() {
  const { t } = await getTranslations();
  const store = await getStoreAsync();
  const showDonorList = store.site_settings?.donors_public === "1";

  const donations = (await getAllDonations()).filter((d) => d.status === "completed");
  const totalUsd = donations
    .filter((d) => d.currency === "USD")
    .reduce((sum, d) => sum + d.amount, 0);
  const totalCdf = donations
    .filter((d) => d.currency === "CDF")
    .reduce((sum, d) => sum + d.amount, 0);
  const count = donations.length;

  const recentPublic = showDonorList
    ? donations
        .slice()
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 10)
        .map((d) => ({
          id: d.id,
          label: d.donor_name?.trim() || "Donateur anonyme",
          amount: `${d.amount.toLocaleString("fr-FR")} ${d.currency}`,
          date: d.created_at.slice(0, 10),
        }))
    : [];

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-cfm-cream p-4 text-center">
          <p className="text-2xl font-bold text-cfm-navy">{count}</p>
          <p className="text-sm text-cfm-earth">{t.common.donationsRecorded}</p>
        </div>
        <div className="rounded-lg bg-cfm-cream p-4 text-center">
          <p className="text-2xl font-bold text-cfm-navy">{totalUsd.toLocaleString("fr-FR")} USD</p>
          <p className="text-sm text-cfm-earth">{t.common.totalUsd}</p>
        </div>
        <div className="rounded-lg bg-cfm-cream p-4 text-center">
          <p className="text-2xl font-bold text-cfm-navy">{totalCdf.toLocaleString("fr-FR")} CDF</p>
          <p className="text-sm text-cfm-earth">{t.common.totalCdf}</p>
        </div>
      </div>

      {showDonorList && recentPublic.length > 0 && (
        <div className="rounded-lg border border-cfm-gold/20 bg-white p-4">
          <h3 className="mb-3 font-semibold text-cfm-navy">Derniers dons (anonymisés)</h3>
          <ul className="space-y-2 text-sm">
            {recentPublic.map((d) => (
              <li key={d.id} className="flex justify-between gap-4 border-b border-gray-50 pb-2 last:border-0">
                <span className="text-cfm-navy">{d.label}</span>
                <span className="text-cfm-earth">
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
