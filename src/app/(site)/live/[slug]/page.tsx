import { notFound } from "next/navigation";
import Link from "next/link";
import { getLiveEventBySlugCached } from "@/infrastructure/cache/live-cache";
import { getPollsForEvent } from "@/infrastructure/repositories/live.repository";
import { LiveRoom } from "@/components/live/LiveRoom";
import { getTranslations } from "@/lib/i18n-server";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";
import { NextActionBlock } from "@/components/ux/NextActionBlock";
import { NewsletterForm } from "@/components/NewsletterForm";

type Props = { params: Promise<{ slug: string }> };

export default async function LiveEventPage({ params }: Props) {
  const { slug } = await params;
  const event = await getLiveEventBySlugCached(slug);
  if (!event) notFound();

  const { t } = await getTranslations();
  const polls = (await getPollsForEvent(event.id)).filter((p) => p.active === 1);
  const live = t.pages.live;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/live" className="text-sm text-site-primary hover:underline">
        ← {t.nav.live}
      </Link>
      <h1 className="section-title mt-4">{event.title}</h1>

      <div className="mt-4">
        <PushSubscribeButton
          labels={{
            subscribe: live?.pushSubscribe ?? "Alertes live",
            subscribed: live?.pushSubscribed ?? "Activé",
            error: live?.pushError ?? "Indisponible",
          }}
        />
      </div>

      <div className="mt-8">
        <LiveRoom
          event={event}
          polls={polls}
          labels={{
            live: live?.badgeLive ?? "EN DIRECT",
            replay: live?.badgeReplay ?? "Replay",
            scheduled: live?.badgeScheduled ?? "Programmé",
            viewers: live?.viewers ?? "spectateurs",
            chat: {
              title: live?.chatTitle ?? "Chat",
              placeholder: live?.chatPlaceholder ?? "Votre message…",
              send: live?.chatSend ?? "Envoyer",
              pending: live?.chatPending ?? "Message en modération",
              closed: live?.chatClosed ?? "Chat fermé",
            },
            poll: {
              vote: live?.pollVote ?? "Voter",
              voted: live?.pollVoted ?? "Merci pour votre vote !",
            },
          }}
        />
      </div>

      <NextActionBlock labels={t.ux.nextAction} showEngage />

      <div className="mx-auto mt-10 max-w-md">
        <NewsletterForm />
      </div>
    </div>
  );
}
