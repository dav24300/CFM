import { getAllDonations } from "@/lib/members";
import { getTranslations } from "@/lib/i18n-server";

export async function DonationTransparency() {
  const { t } = await getTranslations();
  const donations = (await getAllDonations()).filter((d) => d.status === "completed");
  const totalUsd = donations
    .filter((d) => d.currency === "USD")
    .reduce((sum, d) => sum + d.amount, 0);
  const totalCdf = donations
    .filter((d) => d.currency === "CDF")
    .reduce((sum, d) => sum + d.amount, 0);
  const count = donations.length;

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
  );
}
