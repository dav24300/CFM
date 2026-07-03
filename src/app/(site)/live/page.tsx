import { ButtonLink } from "@/components/ui/patterns/button-link";
import { getLiveEvents, getActiveLiveEvent } from "@/lib/live";
import { getTranslations } from "@/lib/i18n-server";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";
import { PageHero } from "@/components/ui/PageHero";
import { MediaCard } from "@/components/ui/MediaCard";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getResolvedLiveThumb } from "@/lib/media.server";
import { MEDIA } from "@/lib/media";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: t.nav.live };
}

export default async function LiveListPage() {
  const { t } = await getTranslations();
  const events = getLiveEvents();
  const active = getActiveLiveEvent();

  return (
    <>
      <PageHero
        title={t.pages.live?.title ?? t.nav.live}
        subtitle={t.pages.live?.subtitle ?? "Suivez nos événements en direct et les replays."}
        image={active?.thumbnail ? getResolvedLiveThumb(active.thumbnail) : getResolvedLiveThumb()}
        imageAlt="Live CFM"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <ScrollReveal>
          <PushSubscribeButton
            labels={{
              subscribe: t.pages.live?.pushSubscribe ?? "Recevoir les alertes live",
              subscribed: t.pages.live?.pushSubscribed ?? "Alertes activées",
              error: t.pages.live?.pushError ?? "Notifications non disponibles",
            }}
          />
        </ScrollReveal>

        {active && (
          <ScrollReveal className="mt-8">
            <div className="card-glass border-l-4 border-red-500">
              <LiveBadge label={t.pages.live?.nowLive ?? "En direct maintenant"} />
              <h2 className="mt-3 font-display text-xl font-bold">{active.title}</h2>
              <p className="mt-2 text-cfm-earth">{active.description}</p>
              <ButtonLink href={`/live/${active.slug}`} size="sm" className="mt-4">
                {t.pages.live?.join ?? "Rejoindre le live"}
              </ButtonLink>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal className="mt-12">
          <h2 className="font-display text-2xl font-bold">{t.pages.live?.allEvents ?? "Tous les événements"}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev) => (
              <MediaCard
                key={ev.id}
                image={getResolvedLiveThumb(ev.thumbnail)}
                imageAlt={ev.thumbnail_alt || ev.title}
                title={ev.title}
                excerpt={ev.description}
                href={`/live/${ev.slug}`}
                badge={ev.status}
                ctaLabel={t.common.discover}
              />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </>
  );
}
