import { ButtonLink } from "@/components/ui/patterns/button-link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

type Labels = {
  title: string;
  subtitle: string;
  signPetition: string;
  makeDonation: string;
  getInvolved?: string;
};

type Props = {
  labels: Labels;
  showEngage?: boolean;
};

export function NextActionBlock({ labels, showEngage = false }: Props) {
  return (
    <ScrollReveal className="mt-12">
      <section className="rounded-xl bg-site-deep p-8 text-center text-white">
        <h2 className="font-serif text-2xl font-bold text-site-primary">{labels.title}</h2>
        <p className="mt-2 text-gray-300">{labels.subtitle}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/petitions" data-cta="cta_petition">
            {labels.signPetition}
          </ButtonLink>
          <ButtonLink href="/s-engager#don" variant="secondary" data-cta="cta_don">
            {labels.makeDonation}
          </ButtonLink>
          {showEngage && labels.getInvolved && (
            <ButtonLink href="/s-engager" variant="outlineLight" data-cta="cta_adhesion">
              {labels.getInvolved}
            </ButtonLink>
          )}
        </div>
      </section>
    </ScrollReveal>
  );
}
