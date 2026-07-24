import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Shield } from "lucide-react";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getPublishedNewsCached as getPublishedNews,
  getActiveCampaignsCached as getActiveCampaigns,
} from "@/infrastructure/cache/content-cache";
import { getResolvedNewsCoverCached as getResolvedNewsCover } from "@/infrastructure/cache/media-cache";
import { getCoordinationStats } from "@/infrastructure/repositories/coordination.repository";
import { getUpcomingEvents } from "@/infrastructure/repositories/events.repository";
import { PortalHomeHeader } from "@/components/portail/PortalHomeHeader";
import { AlertToggles } from "@/components/portail/AlertToggles";

export const metadata: Metadata = { title: "Portail — Fil d'annonces" };

const MONTHS_ABBR = [
  "JANV", "FÉVR", "MARS", "AVR", "MAI", "JUIN",
  "JUIL", "AOÛT", "SEPT", "OCT", "NOV", "DÉC",
];

function railDateBadge(iso: string): { month: string; day: string } {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { month: "—", day: "—" };
  return { month: MONTHS_ABBR[d.getMonth()] ?? "—", day: String(d.getDate()).padStart(2, "0") };
}

export default async function PortailAccueilPage() {
  const user = await getCurrentMember();
  const firstName = user?.first_name || "Membre";

  const news = (await getPublishedNews()).slice(0, 2);
  const campaigns = (await getActiveCampaigns()).slice(0, 1);
  const newsCovers = await Promise.all(news.map((n) => getResolvedNewsCover(n.cover_image)));
  const campaignCovers = await Promise.all(campaigns.map((c) => getResolvedNewsCover(c.image_url)));

  const coordStats = await getCoordinationStats(user?.province ?? undefined);
  const events = (await getUpcomingEvents()).slice(0, 2);

  const hasFeed = campaigns.length > 0 || news.length > 0;

  return (
    <div className="px-6 py-7">
      <div className="mx-auto max-w-portal">
        <PortalHomeHeader
          firstName={firstName}
          coordStats={{
            familiesFollowed: coordStats.familiesFollowed,
            requestsToTreat: coordStats.requestsToTreat,
            upcomingEvents: coordStats.upcomingEvents,
            province: coordStats.province,
          }}
        />

        <div className="grid items-start gap-[22px] lg:grid-cols-[1fr_340px]">
          {/* Colonne feed — annonces officielles CFM (actualités & campagnes réelles) */}
          <div className="flex flex-col gap-4">
            {campaigns.map((c, i) => (
              <FeedCard
                key={`c-${c.slug}`}
                kicker="Campagne"
                title={c.title}
                body={c.description || ""}
                href="/plaidoyer"
                cta="En savoir plus →"
              >
                <FeedCover src={campaignCovers[i]} alt={c.title} />
              </FeedCard>
            ))}
            {news.map((n, i) => (
              <FeedCard
                key={`n-${n.slug}`}
                kicker="Annonce"
                title={n.title}
                body={n.excerpt || ""}
                href={`/actualites/${n.slug}`}
                cta="Lire l'annonce →"
              >
                <FeedCover src={newsCovers[i]} alt={n.cover_image_alt || n.title} />
              </FeedCard>
            ))}
            {!hasFeed && (
              <div className="border border-site-hairline bg-white p-8 text-center text-sm text-site-muted">
                Aucune annonce pour le moment. Revenez bientôt.
              </div>
            )}
          </div>

          {/* Rail */}
          <div className="flex flex-col gap-4">
            <RailCard title="Prochains événements">
              {events.length === 0 ? (
                <p className="text-[13px] text-site-muted-2">Aucun événement à venir.</p>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {events.map((e) => {
                    const b = railDateBadge(e.date);
                    return (
                      <Link key={e.id} href="/membre/evenements" className="flex gap-3.5">
                        <div className="w-12 flex-none border border-site-hairline text-center">
                          <div className="bg-site-deep py-1 text-[10px] font-semibold text-white">{b.month}</div>
                          <div className="py-0.5 font-serif text-lg font-semibold text-site-ink">{b.day}</div>
                        </div>
                        <div>
                          <div className="text-[13.5px] font-semibold leading-tight text-site-ink">{e.title}</div>
                          <div className="mt-0.5 text-xs text-site-muted-2">
                            {e.province}
                            {e.time ? ` · ${e.time}` : ""}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </RailCard>

            <AlertToggles />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedCard({
  kicker,
  title,
  body,
  href,
  cta,
  children,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="border border-site-hairline bg-white">
      <div className="flex items-center gap-3 px-5 pt-[18px]">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center bg-site-deep text-white">
          <Shield className="h-[18px] w-[18px]" aria-hidden />
        </span>
        <div>
          <div className="text-sm font-semibold text-site-ink">
            CFM ASBL <span className="text-xs text-site-primary">· Officiel</span>
          </div>
          <div className="mt-0.5 text-xs text-site-muted-2">{kicker}</div>
        </div>
      </div>
      {children && <div className="mt-3.5 px-5">{children}</div>}
      <div className="px-5 pb-5 pt-3.5">
        <h3 className="mb-1.5 font-serif text-[19px] font-medium leading-[1.25] text-site-ink">{title}</h3>
        {body && <p className="mb-3.5 text-[14.5px] leading-[1.6] text-site-muted">{body}</p>}
        <Link href={href} className="text-[13px] font-semibold text-site-primary hover:underline">
          {cta}
        </Link>
      </div>
    </article>
  );
}

function FeedCover({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-video overflow-hidden bg-site-surface">
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 900px) 100vw, 700px" />
    </div>
  );
}

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-site-hairline bg-white p-5">
      <h3 className="mb-3.5 text-[13px] font-semibold uppercase tracking-[0.05em] text-site-ink">{title}</h3>
      {children}
    </div>
  );
}
