import { AnchorButton } from "@/components/ui/patterns/button-link";

type Labels = {
  title: string;
  colFeature: string;
  colAccount: string;
  colQuick: string;
  rowGoal: string;
  rowAccountGoal: string;
  rowQuickGoal: string;
  rowDelay: string;
  rowAccountDelay: string;
  rowQuickDelay: string;
  rowFollowUp: string;
  rowAccountFollowUp: string;
  rowQuickFollowUp: string;
  ctaAccount: string;
  ctaQuick: string;
};

type Props = { labels: Labels };

export function MembershipComparisonTable({ labels }: Props) {
  const rows = [
    {
      feature: labels.rowGoal,
      account: labels.rowAccountGoal,
      quick: labels.rowQuickGoal,
    },
    {
      feature: labels.rowDelay,
      account: labels.rowAccountDelay,
      quick: labels.rowQuickDelay,
    },
    {
      feature: labels.rowFollowUp,
      account: labels.rowAccountFollowUp,
      quick: labels.rowQuickFollowUp,
    },
  ];

  return (
    <section className="mt-8">
      <h2 className="font-serif text-2xl font-bold">{labels.title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-site-primary/30">
              <th className="py-3 pr-4 font-semibold text-site-ink">{labels.colFeature}</th>
              <th className="py-3 px-4 font-semibold text-site-ink">{labels.colAccount}</th>
              <th className="py-3 pl-4 font-semibold text-site-ink">{labels.colQuick}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.feature} className="border-b border-gray-100">
                <td className="py-3 pr-4 font-medium text-site-muted">{row.feature}</td>
                <td className="py-3 px-4 text-site-muted">{row.account}</td>
                <td className="py-3 pl-4 text-site-muted">{row.quick}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <AnchorButton href="/membre/inscription" size="sm" data-cta="cta_adhesion">
          {labels.ctaAccount}
        </AnchorButton>
        <AnchorButton href="#adhesion" variant="secondary" size="sm" data-cta="cta_adhesion">
          {labels.ctaQuick}
        </AnchorButton>
      </div>
    </section>
  );
}
