import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { getUpcomingEvents } from "@/infrastructure/repositories/events.repository";
import type { PortalEvent, PortalEventType } from "@/domain/entities/v4";
import { PortalPage, PortalEmpty } from "@/components/portail/PortalPage";
import { EventRsvp } from "@/components/portail/EventRsvp";

export const metadata: Metadata = { title: "Portail — Événements" };

const TYPE_LABELS: Record<PortalEventType, string> = {
  atelier: "Atelier",
  rencontre: "Rencontre",
  formation: "Formation",
  distribution: "Distribution",
  autre: "Autre",
};

const MONTHS_ABBR = [
  "JANV",
  "FÉVR",
  "MARS",
  "AVR",
  "MAI",
  "JUIN",
  "JUIL",
  "AOÛT",
  "SEPT",
  "OCT",
  "NOV",
  "DÉC",
];

function dateBadge(iso: string): { month: string; day: string } {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return { month: "—", day: "—" };
  return {
    month: MONTHS_ABBR[d.getMonth()] ?? "—",
    day: String(d.getDate()).padStart(2, "0"),
  };
}

function EventCard({ event, memberId }: { event: PortalEvent; memberId: number }) {
  const badge = dateBadge(event.date);
  const going = event.rsvp_user_ids.includes(memberId);
  const count = event.rsvp_user_ids.length;
  const capacity = event.capacity;
  const full = capacity != null && count >= capacity && !going;
  const progress =
    capacity != null && capacity > 0
      ? Math.min(100, Math.round((count / capacity) * 100))
      : null;

  return (
    <article className="grid grid-cols-[auto_1fr] items-center gap-5 border border-site-hairline bg-white p-6 sm:grid-cols-[auto_1fr_auto] sm:gap-[22px]">
      <div className="w-[66px] flex-none border border-site-hairline text-center">
        <div className="bg-site-deep py-1.5 text-[11px] font-semibold leading-none text-white">
          {badge.month}
        </div>
        <div className="py-1 font-serif text-[26px] font-semibold leading-none text-site-ink">
          {badge.day}
        </div>
      </div>

      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-site-primary">
          {TYPE_LABELS[event.type] ?? event.type}
        </span>
        <h3 className="mt-2 mb-1.5 font-serif text-lg font-medium leading-tight text-site-ink">
          {event.title}
        </h3>
        <p className="text-[13.5px] leading-[1.5] text-site-muted">
          {event.province}
          {event.location ? ` · ${event.location}` : ""}
          {event.time ? ` · ${event.time}` : ""}
        </p>
        {event.description && (
          <p className="mt-2 text-[13.5px] leading-[1.5] text-site-muted-2">
            {event.description}
          </p>
        )}

        <div className="mt-3 max-w-xs">
          <div className="flex justify-between text-[11px] text-site-muted-2">
            <span className="font-semibold text-site-ink">
              {count} inscrit{count > 1 ? "s" : ""}
            </span>
            <span>
              {capacity != null ? `${capacity} places` : "Ouvert à tous"}
            </span>
          </div>
          {progress != null && (
            <div className="mt-1.5 h-1.5 bg-site-surface">
              <div
                className="h-1.5 bg-site-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>

      <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
        <EventRsvp eventId={event.id} initialGoing={going} full={full} />
      </div>
    </article>
  );
}

export default async function PortailEvenementsPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/membre/connexion");

  const events = await getUpcomingEvents();

  return (
    <PortalPage
      title="Événements"
      subtitle="Ateliers, rencontres et rassemblements de la communauté CFM."
    >
      {events.length === 0 ? (
        <PortalEmpty>Aucun événement à venir pour le moment.</PortalEmpty>
      ) : (
        <div className="flex flex-col gap-3.5">
          {events.map((event) => (
            <EventCard key={event.id} event={event} memberId={member.id} />
          ))}
        </div>
      )}
    </PortalPage>
  );
}
