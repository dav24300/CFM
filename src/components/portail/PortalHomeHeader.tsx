"use client";

import Link from "next/link";
import { Plus, HandHeart, Activity } from "lucide-react";
import { usePortalRole } from "@/components/portail/portal-role-context";

const CTA: Record<string, { href: string; label: string }> = {
  famille: { href: "/portail/aide", label: "Nouvelle demande d'aide" },
  benevole: { href: "/portail/evenements", label: "Proposer mon aide" },
  coordinateur: { href: "/portail/coordination", label: "Diffuser une annonce" },
};

type CoordStats = {
  familiesFollowed: number;
  requestsToTreat: number;
  upcomingEvents: number;
  province: string | null;
};

export function PortalHomeHeader({
  firstName,
  coordStats,
}: {
  firstName: string;
  coordStats?: CoordStats;
}) {
  const role = usePortalRole();
  const cta = CTA[role];

  const provinceLabel = coordStats?.province ? ` · ${coordStats.province}` : "";
  const coordTiles = [
    {
      v: String(coordStats?.familiesFollowed ?? 0),
      l: `Familles suivies${provinceLabel}`,
      warn: false,
    },
    { v: String(coordStats?.requestsToTreat ?? 0), l: "Demandes à traiter", warn: (coordStats?.requestsToTreat ?? 0) > 0 },
    { v: String(coordStats?.upcomingEvents ?? 0), l: "Événements à venir", warn: false },
  ];

  return (
    <>
      <div className="mb-[22px] flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <h1 className="font-serif text-[clamp(24px,3vw,32px)] font-medium leading-[1.1] text-site-ink">
            Bonjour, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-sm text-site-muted-2">
            Voici les dernières nouvelles de la communauté CFM.
          </p>
        </div>
        <Link
          href={cta.href}
          className="inline-flex items-center gap-2 bg-site-primary px-[18px] py-3 text-sm font-semibold text-white transition hover:bg-site-primary-dark"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {cta.label}
        </Link>
      </div>

      {role === "benevole" && (
        <div className="mb-4 flex items-center gap-2.5 border border-[#d4e0f5] bg-site-pale px-4 py-3 text-[13px] font-medium leading-[1.5] text-site-primary">
          <HandHeart className="h-4 w-4 shrink-0" aria-hidden />
          Espace bénévole — merci pour votre engagement aux côtés des familles militaires.
        </div>
      )}

      {role === "coordinateur" && (
        <>
          <div className="mb-4 flex items-center gap-2.5 bg-[#12325f] px-4 py-3 text-[13px] font-medium leading-[1.5] text-white">
            <Activity className="h-4 w-4 shrink-0 text-site-light" aria-hidden />
            Vue coordinateur —{" "}
            <Link href="/portail/coordination" className="text-site-light hover:underline">
              accéder à la coordination provinciale →
            </Link>
          </div>
          <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3.5">
            {coordTiles.map((k) => (
              <div key={k.l} className="border border-site-hairline bg-white p-[18px]">
                <div
                  className={`font-serif text-[26px] font-medium leading-none ${
                    k.warn ? "text-admin-warn-fg" : "text-site-primary"
                  }`}
                >
                  {k.v}
                </div>
                <div className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-site-muted-2">
                  {k.l}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
