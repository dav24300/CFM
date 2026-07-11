import "server-only";
import type { PortalEvent, MemberMessage, MemberResource } from "@/domain/entities/v4";
import { normalizePgRow, normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";
import {
  demoMemberResourceSeeds,
  demoPortalEventSeeds,
} from "@/infrastructure/persistence/store-seed";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query, withTransaction } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat portail membre en SQL ciblé (mode PG) :
 * events, member_messages, member_resources.
 * Mêmes signatures et mêmes comportements que les branches Store de
 * events/messages/resources.repository ; le RSVP recalcule le tableau JSONB
 * côté JS sous verrou FOR UPDATE (concurrent-safe) et l'accusé de réception
 * est inséré dans la même transaction que le message sortant.
 * "date", "time" et "read" sont des identifiants réservés : toujours quotés.
 */

/** Tri chronologique (date + heure) croissant — équivalent SQL de byDateAsc. */
const ORDER_BY_DATE_ASC =
  `ORDER BY "date" ASC, COALESCE(NULLIF("time", ''), '00:00') ASC, id ASC`;

export async function getUpcomingEvents(): Promise<PortalEvent[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await query<PortalEvent>(
      `SELECT * FROM events WHERE "date" >= $1 ${ORDER_BY_DATE_ASC}`,
      [today]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function listPortalEvents(): Promise<PortalEvent[]> {
  try {
    // Ordre d'insertion (id ASC) — équivalent de l'ordre du store.
    const res = await query<PortalEvent>("SELECT * FROM events ORDER BY id");
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getAllEvents(): Promise<PortalEvent[]> {
  try {
    const res = await query<PortalEvent>(`SELECT * FROM events ${ORDER_BY_DATE_ASC}`);
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getEventsForProvince(province: string): Promise<PortalEvent[]> {
  try {
    const res = await query<PortalEvent>(
      `SELECT * FROM events WHERE province = $1 ${ORDER_BY_DATE_ASC}`,
      [province]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function rsvpEvent(
  eventId: number,
  userId: number
): Promise<PortalEvent | undefined> {
  return withTransaction(async (client) => {
    const res = await client.query<PortalEvent>(
      "SELECT * FROM events WHERE id = $1 FOR UPDATE",
      [eventId]
    );
    const ev = res.rows[0];
    if (!ev) return undefined; // introuvable : aucun effet de bord (parité Store)
    // Toggle : retire le userId s'il est inscrit, l'ajoute sinon — tableau
    // recalculé en JS sous verrou, puis réécrit en JSONB.
    const current = Array.isArray(ev.rsvp_user_ids) ? ev.rsvp_user_ids : [];
    const next = current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId];
    await client.query("UPDATE events SET rsvp_user_ids = $2::jsonb WHERE id = $1", [
      eventId,
      JSON.stringify(next),
    ]);
    return normalizePgRow({ ...ev, rsvp_user_ids: next });
  }).catch((err) => mapPgError(err));
}

export async function getMessagesForUser(userId: number): Promise<MemberMessage[]> {
  try {
    const res = await query<MemberMessage>(
      "SELECT * FROM member_messages WHERE user_id = $1 ORDER BY created_at ASC, id ASC",
      [userId]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function sendMemberMessage(
  userId: number,
  data: { subject?: string; body: string }
): Promise<MemberMessage> {
  return withTransaction(async (client) => {
    const now = new Date();
    const res = await client.query<MemberMessage>(
      `INSERT INTO member_messages (user_id, direction, author_name, subject, body, "read", created_at)
       VALUES ($1, 'out', 'Vous', $2, $3, 1, $4)
       RETURNING *`,
      [
        userId,
        data.subject?.trim() ? data.subject.trim() : null,
        data.body,
        now.toISOString(),
      ]
    );
    // Accusé de réception automatique du référent, 1 ms après pour garantir
    // l'ordre chronologique (parité Store).
    await client.query(
      `INSERT INTO member_messages (user_id, direction, author_name, subject, body, "read", created_at)
       VALUES ($1, 'in', 'Référent CFM', NULL, $2, 0, $3)`,
      [
        userId,
        "Message bien reçu — un référent vous répondra sous 48h.",
        new Date(now.getTime() + 1).toISOString(),
      ]
    );
    return normalizePgRow(res.rows[0]);
  }).catch((err) => mapPgError(err));
}

export async function markMessagesRead(userId: number): Promise<void> {
  try {
    await query(
      `UPDATE member_messages SET "read" = 1 WHERE user_id = $1 AND direction = 'in'`,
      [userId]
    );
  } catch (err) {
    mapPgError(err);
  }
}

export async function getAllResources(): Promise<MemberResource[]> {
  try {
    // id DESC — équivalent du [...store.member_resources].reverse() historique.
    const res = await query<MemberResource>(
      "SELECT * FROM member_resources ORDER BY id DESC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getResourcesByCategory(): Promise<
  Record<string, MemberResource[]>
> {
  try {
    // Ordre d'insertion (id ASC) — le groupement préserve l'ordre du store.
    const res = await query<MemberResource>("SELECT * FROM member_resources ORDER BY id");
    const grouped: Record<string, MemberResource[]> = {};
    for (const resource of normalizePgRows(res.rows)) {
      const key = resource.category || "Autre";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(resource);
    }
    return grouped;
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Seed one-shot du portail de démo V4 (tables migrées = plus couvertes par le
 * sync Store) : 3 événements à dates FUTURES relatives + 4 ressources membres.
 * Appelé uniquement depuis le chemin claimSeedVersion (sérialisé par verrou
 * advisory) — pas de contrainte unique naturelle sur ces tables.
 */
export async function seedDefaultPortalDataIfEmpty(): Promise<void> {
  try {
    const events = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM events");
    if (events.rows[0].n === 0) {
      const now = new Date().toISOString();
      for (const seed of demoPortalEventSeeds(now)) {
        await query(
          `INSERT INTO events (title, description, province, "date", "time", type, location, capacity, rsvp_user_ids, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)`,
          [
            seed.title,
            seed.description,
            seed.province,
            seed.date,
            seed.time,
            seed.type,
            seed.location,
            seed.capacity,
            JSON.stringify(seed.rsvp_user_ids),
            seed.created_at,
          ]
        );
      }
    }

    const resources = await query<{ n: number }>(
      "SELECT COUNT(*)::int AS n FROM member_resources"
    );
    if (resources.rows[0].n === 0) {
      const now = new Date().toISOString();
      for (const seed of demoMemberResourceSeeds(now)) {
        await query(
          `INSERT INTO member_resources (title, category, description, file_url, external_url, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            seed.title,
            seed.category,
            seed.description,
            seed.file_url,
            seed.external_url,
            seed.created_at,
          ]
        );
      }
    }
  } catch (err) {
    mapPgError(err);
  }
}
