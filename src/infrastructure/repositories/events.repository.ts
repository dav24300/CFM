import {
  getStoreAsync,
  updateStoreAsync,
} from "@/infrastructure/persistence/store-access";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlPortal from "@/infrastructure/repositories/sql/portal.sql";
import type { PortalEvent } from "@/domain/entities/v4";

/**
 * Agrégat portail (événements) — dual-mode :
 * - PG (DATABASE_URL) : SQL ciblé (sql/portal.sql.ts), RSVP transactionnel
 *   sous verrou FOR UPDATE — concurrent-safe.
 * - JSON (dev) : branche Store historique inchangée.
 */

/** Tri chronologique (date + heure) croissant. */
function byDateAsc(a: PortalEvent, b: PortalEvent): number {
  const da = `${a.date}T${a.time || "00:00"}`;
  const db = `${b.date}T${b.time || "00:00"}`;
  return da.localeCompare(db);
}

/** Événements à venir (date >= aujourd'hui), triés par date croissante. */
export async function getUpcomingEvents(): Promise<PortalEvent[]> {
  if (isPgMode()) return sqlPortal.getUpcomingEvents();
  const store = await getStoreAsync();
  const today = new Date().toISOString().slice(0, 10);
  return (store.events ?? [])
    .filter((e) => e.date >= today)
    .sort(byDateAsc);
}

/** Tous les événements du portail, sans tri (ordre du store). */
export async function listPortalEvents(): Promise<PortalEvent[]> {
  if (isPgMode()) return sqlPortal.listPortalEvents();
  const store = await getStoreAsync();
  return store.events ?? [];
}

/** Tous les événements, triés par date croissante. */
export async function getAllEvents(): Promise<PortalEvent[]> {
  if (isPgMode()) return sqlPortal.getAllEvents();
  const store = await getStoreAsync();
  return [...(store.events ?? [])].sort(byDateAsc);
}

/** Événements d'une province donnée, triés par date croissante. */
export async function getEventsForProvince(
  province: string
): Promise<PortalEvent[]> {
  if (isPgMode()) return sqlPortal.getEventsForProvince(province);
  const store = await getStoreAsync();
  return (store.events ?? [])
    .filter((e) => e.province === province)
    .sort(byDateAsc);
}

/**
 * Bascule l'inscription (RSVP) d'un membre sur un événement :
 * ajoute son userId à rsvp_user_ids s'il n'y est pas, l'en retire sinon.
 * Retourne l'événement mis à jour (ou undefined si introuvable).
 */
export async function rsvpEvent(
  eventId: number,
  userId: number
): Promise<PortalEvent | undefined> {
  if (isPgMode()) return sqlPortal.rsvpEvent(eventId, userId);
  let result: PortalEvent | undefined;
  await updateStoreAsync((store) => {
    if (!store.events) store.events = [];
    const ev = store.events.find((e) => e.id === eventId);
    if (!ev) return;
    if (!Array.isArray(ev.rsvp_user_ids)) ev.rsvp_user_ids = [];
    if (ev.rsvp_user_ids.includes(userId)) {
      ev.rsvp_user_ids = ev.rsvp_user_ids.filter((id) => id !== userId);
    } else {
      ev.rsvp_user_ids = [...ev.rsvp_user_ids, userId];
    }
    result = ev;
  });
  return result;
}
