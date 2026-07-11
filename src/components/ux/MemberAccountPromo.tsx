import Link from "next/link";
import { ButtonLink } from "@/components/ui/patterns/button-link";

type Labels = {
  title: string;
  body: string;
  benefit1: string;
  benefit2: string;
  benefit3: string;
  cta: string;
};

type Props = { labels: Labels };

export function MemberAccountPromo({ labels }: Props) {
  return (
    <div className="card mt-6 border-l-4 border-site-primary">
      <h3 className="font-serif text-lg font-bold text-site-ink">{labels.title}</h3>
      <p className="mt-2 text-sm text-site-muted">{labels.body}</p>
      <ul className="mt-3 space-y-1 text-sm text-site-muted">
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-site-primary" />
          {labels.benefit1}
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-site-primary" />
          {labels.benefit2}
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-site-primary" />
          {labels.benefit3}
        </li>
      </ul>
      <ButtonLink href="/membre/inscription" size="sm" className="mt-4" data-cta="cta_adhesion">
        {labels.cta}
      </ButtonLink>
    </div>
  );
}
