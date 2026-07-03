import type { Metadata } from "next";

import { AnchorButton, ButtonLink } from "@/components/ui/patterns/button-link";

import { DonationForm } from "@/components/DonationForm";
import { MembershipForm } from "@/components/MembershipForm";

import { DonationTransparency } from "@/components/DonationTransparency";

import { Heart, Users, HandHeart } from "lucide-react";

import { getTranslations } from "@/lib/i18n-server";



export async function generateMetadata(): Promise<Metadata> {

  const { t } = await getTranslations();

  return { title: t.pages.engage.title };

}



const typeIcons = {

  famille: Users,

  soutien: Heart,

  benevole: HandHeart,

};



const typeIds = ["famille", "soutien", "benevole"] as const;



export default async function EngagerPage() {

  const { t } = await getTranslations();

  const e = t.pages.engage;

  const x = t.pages.engageExtra;



  return (

    <div className="mx-auto max-w-6xl px-4 py-12">

      <h1 className="section-title">{e.title}</h1>

      <p className="section-subtitle max-w-3xl">{e.subtitle}</p>



      <section className="mt-12">

        <h2 className="font-display text-2xl font-bold">{e.typesTitle}</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-3">

          {typeIds.map((id) => {

            const Icon = typeIcons[id];

            const type = t.membershipTypes[id];

            return (

              <div key={id} className="card text-center">

                <div className="mx-auto inline-flex rounded-full bg-cfm-cream p-4 text-cfm-gold">

                  <Icon className="h-8 w-8" aria-hidden />

                </div>

                <h3 className="mt-4 font-display text-xl font-bold">{type.label}</h3>

                <p className="mt-2 text-sm text-cfm-earth">{type.description}</p>

              </div>

            );

          })}

        </div>

      </section>



      <section className="mt-12 card border-l-4 border-cfm-gold">

        <h2 className="font-display text-2xl font-bold">{e.memberTitle}</h2>

        <p className="mt-2 text-cfm-earth">{e.memberSubtitle}</p>

        <div className="mt-4 flex flex-wrap gap-3">

          <AnchorButton href="/membre/inscription" size="sm">{x.createAccount}</AnchorButton>
          <AnchorButton href="/membre/connexion" variant="secondary" size="sm">{x.signIn}</AnchorButton>

        </div>

      </section>



      <section className="mt-16" id="adhesion">

        <h2 className="font-display text-2xl font-bold">{x.quickSignupTitle}</h2>

        <p className="mt-2 text-cfm-earth">{x.quickSignupDesc}</p>

        <div className="mt-6 card max-w-2xl">

          <MembershipForm />

        </div>

      </section>



      <section className="mt-16" id="don">

        <div className="card">

          <h2 className="font-display text-2xl font-bold">{e.donateTitle}</h2>

          <p className="mt-2 text-cfm-earth">{e.donateSubtitle}</p>

          <div className="mt-6 max-w-lg">

            <DonationForm />

          </div>

        </div>

      </section>



      <section className="mt-16" id="transparence">

        <h2 className="font-display text-2xl font-bold">{x.transparencyTitle}</h2>

        <p className="mt-4 text-cfm-earth max-w-3xl">{x.transparencyBody}</p>

        <div className="mt-6 card">

          <h3 className="font-semibold">{x.fundsTitle}</h3>

          <ul className="mt-4 space-y-2 text-cfm-earth">

            {[x.fund1, x.fund2, x.fund3, x.fund4].map((item) => (

              <li key={item} className="flex items-center gap-2">

                <span className="h-2 w-2 rounded-full bg-cfm-gold" />

                {item}

              </li>

            ))}

          </ul>

          <p className="mt-4 text-sm text-gray-500">{x.annualReport}</p>

          <DonationTransparency />

        </div>

      </section>



      <section className="mt-16" id="partenaire">

        <h2 className="font-display text-2xl font-bold">{x.partnerTitle}</h2>

        <p className="mt-4 text-cfm-earth">{x.partnerBody}</p>

        <AnchorButton href="/contact?type=partenariat" className="mt-4">
          {x.partnerBtn}
        </AnchorButton>

      </section>

    </div>

  );

}

