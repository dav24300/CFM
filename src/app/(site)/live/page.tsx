import { NextActionBlock } from "@/components/ux/NextActionBlock";
import { ButtonLink } from "@/components/ui/patterns/button-link";
import { getLiveEventsCached, getActiveLiveEventCached } from "@/infrastructure/cache/live-cache";
import { getTranslationsFor } from "@/lib/i18n-server";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";
import { InteriorHero } from "@/components/ui/InteriorHero";
import { MediaCard } from "@/components/ui/MediaCard";
import { LiveBadge } from "@/components/ui/LiveBadge";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { getResolvedLiveThumbCached as getResolvedLiveThumb } from "@/infrastructure/cache/media-cache";

export async function generateMetadata() {
  const { t } = await getTranslationsFor("fr");
  return { title: t.nav.live };
}

export default async function LiveListPage() {
  const { locale, t } = await getTranslationsFor("fr");
  const events = await getLiveEventsCached();
  const active = await getActiveLiveEventCached();
  const heroThumb = await getResolvedLiveThumb(active?.thumbnail);
  const eventThumbs = await Promise.all(events.map((ev) => getResolvedLiveThumb(ev.thumbnail)));

  return (
    <>
      <InteriorHero
        breadcrumb={[{ label: locale === "en" ? "Home" : "Accueil", href: "/" }, { label: t.nav.live }]}
        kicker={locale === "en" ? "Live & events" : "Live & événements"}
        title={t.pages.live?.title ?? t.nav.live}
        subtitle={t.pages.live?.subtitle ?? "Suivez nos événements en direct et les replays."}
        image={heroThumb}
        imageAlt="Live CFM"
      />

      <div className="mx-auto max-w-site px-6 py-20">
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
            <div className="border-l-[3px] border-site-live bg-site-surface p-7">
              <LiveBadge label={t.pages.live?.nowLive ?? "En direct maintenant"} />
              <h2 className="mt-3 font-serif text-xl font-medium text-site-ink">{active.title}</h2>
              <p className="mt-2 text-site-muted">{active.description}</p>
              <ButtonLink href={`/live/${active.slug}`} size="sm" className="mt-4" data-cta="cta_live">
                {t.pages.live?.join ?? "Rejoindre le live"}
              </ButtonLink>
            </div>
          </ScrollReveal>
        )}

        <ScrollReveal className="mt-12">
          <h2 className="font-serif text-2xl font-medium text-site-ink">
            {t.pages.live?.allEvents ?? "Tous les événements"}
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((ev, i) => (
              <MediaCard
                key={ev.id}
                image={eventThumbs[i]}
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

        <div className="mt-12">
          <NextActionBlock labels={t.ux.nextAction} />
        </div>
      </div>
    </>
  );
}
