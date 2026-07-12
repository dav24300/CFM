import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Shield, Check, ThumbsUp, MessageCircle, Play } from "lucide-react";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getPublishedNewsCached as getPublishedNews,
  getActiveCampaignsCached as getActiveCampaigns,
} from "@/infrastructure/cache/content-cache";
import { getResolvedNewsCoverCached as getResolvedNewsCover } from "@/infrastructure/cache/media-cache";
import { getCoordinationStats } from "@/infrastructure/repositories/coordination.repository";
import { PortalHomeHeader } from "@/components/portail/PortalHomeHeader";
import { AlertToggles } from "@/components/portail/AlertToggles";

export const metadata: Metadata = { title: "Portail — Fil d'annonces" };

export default async function PortailAccueilPage() {
  const user = await getCurrentMember();
  const firstName = user?.first_name || "Membre";

  const news = (await getPublishedNews()).slice(0, 2);
  const campaigns = (await getActiveCampaigns()).slice(0, 1);
  const newsCovers = await Promise.all(news.map((n) => getResolvedNewsCover(n.cover_image)));
  const campaignCovers = await Promise.all(campaigns.map((c) => getResolvedNewsCover(c.image_url)));

  const coordStats = await getCoordinationStats(user?.province ?? undefined);

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
          {/* Colonne feed */}
          <div className="flex flex-col gap-4">
            {/* Composer entraide */}
            <div className="border border-site-hairline bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center bg-site-pale text-sm font-semibold text-site-primary">
                  {firstName[0]?.toUpperCase()}
                </span>
                <input
                  type="text"
                  placeholder="Partager un message d'entraide…"
                  className="flex-1 border border-site-hairline bg-site-surface px-3 py-2.5 text-sm focus:border-site-primary focus:outline-none"
                />
                <button
                  type="button"
                  className="bg-site-primary px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-site-primary-dark"
                >
                  Publier
                </button>
              </div>
              <p className="ml-[50px] mt-2.5 text-xs text-site-muted-2">
                Les publications d’entraide sont modérées par l’équipe CFM avant diffusion.
              </p>
            </div>

            {/* Annonces — replay live (statique de marque) */}
            <FeedCard badge="Replay" badgeLive kicker="Annonce · il y a 2 jours" title="Le replay du rassemblement FIKIN 2025 est disponible" body="Revivez le rassemblement historique des familles de militaires. Merci à toutes et tous pour votre mobilisation." href="/live" cta="Voir le replay →">
              <div className="relative aspect-video overflow-hidden bg-site-deep">
                <div
                  className="absolute inset-0"
                  style={{ background: "repeating-linear-gradient(125deg,#16233d 0,#16233d 12px,#1d2c49 12px,#1d2c49 24px)" }}
                  aria-hidden
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center bg-white/95 text-site-deep shadow-[0_8px_30px_rgba(0,0,0,.35)]">
                    <Play className="h-6 w-6 fill-current" aria-hidden />
                  </span>
                </span>
                <span className="absolute left-2.5 top-2.5 bg-site-live px-2 py-1 text-[10px] font-bold uppercase tracking-[0.04em] text-white">
                  YouTube
                </span>
              </div>
            </FeedCard>

            {/* Annonces — actualités & campagnes réelles */}
            {campaigns.map((c, i) => (
              <FeedCard
                key={`c-${c.slug}`}
                badge="Campagne"
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
                badge="Actualité"
                kicker="Annonce"
                title={n.title}
                body={n.excerpt || ""}
                href={`/actualites/${n.slug}`}
                cta="Lire l'annonce →"
              >
                <FeedCover src={newsCovers[i]} alt={n.cover_image_alt || n.title} />
              </FeedCard>
            ))}

            {/* Post d'entraide modéré (exemple) */}
            <article className="border border-site-hairline bg-white">
              <div className="flex items-center gap-3 px-5 pt-[18px]">
                <span className="flex h-[38px] w-[38px] flex-none items-center justify-center bg-site-surface text-sm font-semibold text-site-primary">
                  BM
                </span>
                <div>
                  <div className="text-sm font-semibold text-site-ink">Béatrice M.</div>
                  <div className="mt-0.5 text-xs text-site-muted-2">Entraide · Nord-Kivu · il y a 1 jour</div>
                </div>
                <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-site-success">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Modéré
                </span>
              </div>
              <p className="px-5 py-3.5 text-[14.5px] leading-[1.6] text-site-muted">
                Bonjour à toutes. Existe-t-il un groupe d’entraide pour les démarches de scolarité des
                orphelins à Goma ? Merci de votre aide 🙏
              </p>
              <div className="mt-2 flex gap-5 border-t border-site-hairline px-5 py-3.5 text-[13px] font-medium text-site-muted-2">
                <button type="button" className="inline-flex items-center gap-1.5 hover:text-site-primary">
                  <ThumbsUp className="h-4 w-4" aria-hidden /> Soutenir · 12
                </button>
                <Link href="/portail/entraide" className="inline-flex items-center gap-1.5 hover:text-site-primary">
                  <MessageCircle className="h-4 w-4" aria-hidden /> Répondre · 4
                </Link>
              </div>
            </article>
          </div>

          {/* Rail */}
          <div className="flex flex-col gap-4">
            <RailCard title="Notifications">
              <div className="flex flex-col gap-3.5">
                {[
                  { t: "Votre demande d'aide a été mise à jour", d: "il y a 3 h", unread: true },
                  { t: "Nouveau message d'un référent CFM", d: "hier", unread: true },
                  { t: "Atelier entrepreneuriat — places ouvertes", d: "il y a 2 j", unread: false },
                ].map((n) => (
                  <div key={n.t} className="flex gap-2.5">
                    <span className={`mt-[5px] h-2 w-2 flex-none ${n.unread ? "bg-site-primary" : "bg-[#d3d8e0]"}`} />
                    <div>
                      <p className={`text-[13.5px] font-medium leading-[1.45] ${n.unread ? "text-site-ink" : "text-site-muted"}`}>
                        {n.t}
                      </p>
                      <span className="text-xs text-site-muted-2">{n.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </RailCard>

            <RailCard title="Prochains événements">
              <div className="flex flex-col gap-3.5">
                {[
                  { m: "MARS", d: "10", t: "Atelier entrepreneuriat", s: "Nord-Kivu · 09:00" },
                  { m: "AVR", d: "05", t: "Rencontre familles — Kinshasa", s: "Kinshasa · 14:00" },
                ].map((e) => (
                  <Link key={e.t} href="/portail/evenements" className="flex gap-3.5">
                    <div className="w-12 flex-none border border-site-hairline text-center">
                      <div className="bg-site-deep py-1 text-[10px] font-semibold text-white">{e.m}</div>
                      <div className="py-0.5 font-serif text-lg font-semibold text-site-ink">{e.d}</div>
                    </div>
                    <div>
                      <div className="text-[13.5px] font-semibold leading-tight text-site-ink">{e.t}</div>
                      <div className="mt-0.5 text-xs text-site-muted-2">{e.s}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </RailCard>

            <AlertToggles />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedCard({
  badge,
  badgeLive,
  kicker,
  title,
  body,
  href,
  cta,
  children,
}: {
  badge: string;
  badgeLive?: boolean;
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
        {badgeLive && (
          <span className="ml-auto animate-live-pulse bg-site-live px-2 py-1 text-[10px] font-bold uppercase tracking-[0.04em] text-white">
            {badge}
          </span>
        )}
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
