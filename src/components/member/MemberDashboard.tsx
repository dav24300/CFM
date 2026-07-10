"use client";



import { useEffect, useState } from "react";

import Link from "next/link";
import { Button } from "@/components/ui/primitives/button";
import { ButtonLink } from "@/components/ui/patterns/button-link";

import { Users, Heart, CreditCard, LogOut, Radio, Megaphone } from "lucide-react";

import { FamilyLinkManager } from "@/components/member/FamilyLinkManager";

import type { PublicUser } from "@/lib/types/v2";

import { SkeletonList } from "@/components/ui/primitives/skeleton";
import { useTranslations } from "@/lib/i18n-client";



type Props = {
  initialUser: PublicUser;
  activeLive?: { slug: string; title: string } | null;
  openPetitionsCount?: number;
};

export function MemberDashboard({
  initialUser,
  activeLive = null,
  openPetitionsCount = 0,
}: Props) {

  const { t } = useTranslations();

  const m = t.pages.memberArea;

  const f = t.forms;

  const [data, setData] = useState<{

    helpRequests: { id: number; need_type: string; status: string; description: string }[];

    donations: { id: number; amount: number; currency: string; provider: string; status: string }[];

  } | null>(null);

  const [loading, setLoading] = useState(true);

  const user = initialUser;



  useEffect(() => {

    if (user.status !== "active") {

      setLoading(false);

      return;

    }

    fetch("/api/member/me")

      .then((r) => r.json())

      .then((d) => {

        setData({ helpRequests: d.helpRequests || [], donations: d.donations || [] });

        setLoading(false);

      });

  }, [user.status]);



  async function logout() {

    await fetch("/api/member/logout", { method: "POST" });

    window.location.href = "/membre/connexion";

  }



  if (loading && user.status === "active") {

    return (
      <div className="py-12" aria-busy="true" aria-label={t.common.loading}>
        <SkeletonList count={2} variant="card" className="mx-auto max-w-2xl" />
      </div>
    );

  }



  const isActive = user.status === "active";

  const isPending = user.status === "pending";



  return (

    <div className="space-y-8">

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div>

          <h1 className="section-title">{m.dashboardHello}, {user.first_name}</h1>

          <p className="text-site-muted">

            {user.membership_type} —{" "}

            {user.status === "active" ? m.accountActive : m.accountPending}

          </p>

          {isActive && (

            <Link href="/membre/profil" className="mt-2 inline-block text-sm text-site-primary hover:underline">

              {m.editProfile}

            </Link>

          )}

        </div>

        <Button type="button" variant="secondary" size="sm" onClick={logout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" /> {t.common.logout}
        </Button>

      </div>



      {isPending && (

        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">

          {m.pendingBanner}

        </div>

      )}



      {isActive && user.role === "volunteer" && (

        <div className="rounded-xl border border-site-primary/30 bg-site-surface p-4">

          <p className="text-sm">{m.volunteerBanner}</p>

          <ButtonLink href="/admin/dashboard" size="sm" className="mt-3">
            {m.volunteerDashboard}
          </ButtonLink>

        </div>

      )}



      {isActive && (

        <>

          {user.membership_type === "famille" && (

            <section className="card">

              <div className="flex items-center gap-2">

                <Users className="h-5 w-5 text-site-primary" />

                <h2 className="font-serif text-xl font-bold">{f.familyLinks}</h2>

              </div>

              <FamilyLinkManager />

            </section>

          )}



          <section className="card">

            <div className="flex items-center gap-2">

              <Heart className="h-5 w-5 text-site-primary" />

              <h2 className="font-serif text-xl font-bold">{f.myHelpRequests}</h2>

            </div>

            {data && data.helpRequests.length === 0 ? (

              <p className="mt-4 text-sm text-site-muted">

                {m.noHelp}{" "}

                <Link href="/contact#aide" className="text-site-primary hover:underline">

                  {m.requestHelp}

                </Link>

              </p>

            ) : data ? (

              <div className="mt-4 space-y-3">

                {data.helpRequests.map((h) => (

                  <div key={h.id} className="rounded-lg bg-site-surface p-3 text-sm">

                    <div className="flex justify-between">

                      <span className="font-semibold">{h.need_type}</span>

                      <span className="rounded-full bg-white px-2 py-0.5 text-xs">{h.status}</span>

                    </div>

                    <p className="mt-1 text-site-muted line-clamp-2">{h.description}</p>

                  </div>

                ))}

              </div>

            ) : null}

          </section>



          <section className="card">

            <div className="flex items-center gap-2">

              <CreditCard className="h-5 w-5 text-site-primary" />

              <h2 className="font-serif text-xl font-bold">{f.myDonations}</h2>

            </div>

            {data && data.donations.length === 0 ? (

              <p className="mt-4 text-sm text-site-muted">

                {m.noDonations}{" "}

                <Link href="/s-engager#don" className="text-site-primary hover:underline">

                  {m.donate}

                </Link>

              </p>

            ) : data ? (

              <ul className="mt-4 space-y-2 text-sm">

                {data.donations.map((d) => (

                  <li key={d.id} className="flex justify-between rounded-lg bg-site-surface p-3">

                    <span>

                      {d.amount} {d.currency} — {d.provider}

                    </span>

                    <span className="text-site-primary">{d.status}</span>

                  </li>

                ))}

              </ul>

            ) : null}

          </section>



          <section className="card">
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-site-primary" />
              <h2 className="font-serif text-xl font-bold">{t.ux.memberDashboard.citizenActionsTitle}</h2>
            </div>
            <p className="mt-2 text-sm text-site-muted">{t.ux.memberDashboard.citizenActionsBody}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {activeLive && (
                <ButtonLink href={`/live/${activeLive.slug}`} size="sm" data-cta="cta_live">
                  <Radio className="mr-1 h-4 w-4" />
                  {t.ux.memberDashboard.liveNow}
                </ButtonLink>
              )}
              {openPetitionsCount > 0 && (
                <ButtonLink href="/petitions" variant="secondary" size="sm" data-cta="cta_petition">
                  {t.ux.memberDashboard.openPetitions} ({openPetitionsCount})
                </ButtonLink>
              )}
              <ButtonLink href="/s-engager#don" variant="secondary" size="sm" data-cta="cta_don">
                {m.donate}
              </ButtonLink>
            </div>
          </section>



          <div className="flex flex-wrap gap-3">

              <ButtonLink href="/petitions" size="sm" data-cta="cta_petition">
              {t.common.viewPetitions}
            </ButtonLink>

              <ButtonLink href="/s-engager#don" variant="secondary" size="sm" data-cta="cta_don">
              {m.donate}
            </ButtonLink>

          </div>

        </>

      )}

    </div>

  );

}

