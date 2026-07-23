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

/**
 * Colonnes calculées remplaçant `rsvp_user_ids` : un compteur, et l'état
 * d'inscription du seul membre qui consulte. La liste des inscrits ne quitte
 * plus la base.
 */
const RSVP_COLUMNS = `
  (SELECT count(*)::int FROM event_rsvps r WHERE r.event_id = e.id) AS rsvp_count,
  ($2::int IS NOT NULL
   AND EXISTS (SELECT 1 FROM event_rsvps r WHERE r.event_id = e.id AND r.user_id = $2::int)
  ) AS viewer_going,
  '[]'::jsonb AS rsvp_user_ids`;

const ORDER_BY_DATE_ASC_E =
  `ORDER BY e."date" ASC, COALESCE(NULLIF(e."time", ''), '00:00') ASC, e.id ASC`;

export async function getUpcomingEvents(viewerId?: number): Promise<PortalEvent[]> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const res = await query<PortalEvent>(
      `SELECT e.*, ${RSVP_COLUMNS}
       FROM events e WHERE e."date" >= $1 ${ORDER_BY_DATE_ASC_E}`,
      [today, viewerId ?? null]
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

export type RsvpResult = { going: boolean; count: number; full?: boolean };

/**
 * Inscription / désinscription à un événement (bascule, comme avant).
 *
 * L'ancienne version lisait la ligne `events` sous `FOR UPDATE`, recalculait le
 * tableau `rsvp_user_ids` en JavaScript puis le réécrivait en entier : coût
 * O(n) sur le nombre d'inscrits, et toutes les inscriptions d'un même événement
 * sérialisées sur trois allers-retours réseau.
 *
 * Deux défauts fonctionnels sont corrigés au passage :
 *  - la capacité n'était vérifiée NULLE PART côté serveur (seulement l'état
 *    `disabled` du bouton) : un POST direct la dépassait sans obstacle ;
 *  - la réponse exposait `rsvp_user_ids`, donc les identifiants des AUTRES
 *    membres, au navigateur.
 *
 * Concurrence : deux chemins d'inscription selon l'événement.
 *  - capacité illimitée (le cas courant) : une seule instruction, aucun verrou,
 *    aucune sérialisation entre inscrits ;
 *  - capacité définie : le comptage et l'insertion sont faits sous verrou de la
 *    ligne événement. Une garde évaluée sans verrou laissait passer plusieurs
 *    inscriptions simultanées sur la dernière place (mesuré : 9 inscrits pour
 *    5 places sous 20 requêtes parallèles). Sérialiser est ici le prix d'une
 *    limite réellement respectée — et cela ne concerne que les événements
 *    plafonnés.
 */
export async function rsvpEvent(
  eventId: number,
  userId: number
): Promise<RsvpResult | undefined> {
  try {
    // 1. Désinscription : si une ligne existait, la bascule s'arrête là.
    const left = await query(
      "DELETE FROM event_rsvps WHERE event_id = $1::int AND user_id = $2::int RETURNING user_id",
      [eventId, userId]
    );
    if ((left.rowCount ?? 0) > 0) {
      return { going: false, count: await countRsvps(eventId) };
    }

    // 2. Inscription. La capacité détermine le chemin.
    const ev = await query<{ capacity: number | null }>(
      "SELECT capacity FROM events WHERE id = $1::int",
      [eventId]
    );
    if (ev.rowCount === 0) return undefined;

    if (ev.rows[0].capacity === null) {
      // Aucun plafond : insertion directe, sans verrou.
      await query(
        `INSERT INTO event_rsvps (event_id, user_id) VALUES ($1::int, $2::int)
         ON CONFLICT (event_id, user_id) DO NOTHING`,
        [eventId, userId]
      );
      return { going: true, count: await countRsvps(eventId) };
    }

    // Plafond défini : comptage et insertion sous verrou de l'événement, seul
    // moyen de garantir que la limite est respectée sous forte concurrence.
    return withTransaction(async (client) => {
      await client.query("SELECT id FROM events WHERE id = $1::int FOR UPDATE", [eventId]);

      const inserted = await client.query(
        `INSERT INTO event_rsvps (event_id, user_id)
         SELECT e.id, $2::int FROM events e
         WHERE e.id = $1::int
           AND (SELECT count(*) FROM event_rsvps r WHERE r.event_id = e.id) < e.capacity
         ON CONFLICT (event_id, user_id) DO NOTHING
         RETURNING user_id`,
        [eventId, userId]
      );

      const total = await client.query<{ n: number }>(
        "SELECT count(*)::int AS n FROM event_rsvps WHERE event_id = $1::int",
        [eventId]
      );
      const count = total.rows[0]?.n ?? 0;

      return (inserted.rowCount ?? 0) > 0
        ? { going: true, count }
        : { going: false, count, full: true };
    });
  } catch (err) {
    mapPgError(err);
  }
}

async function countRsvps(eventId: number): Promise<number> {
  const res = await query<{ n: number }>(
    "SELECT count(*)::int AS n FROM event_rsvps WHERE event_id = $1::int",
    [eventId]
  );
  return res.rows[0]?.n ?? 0;
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
