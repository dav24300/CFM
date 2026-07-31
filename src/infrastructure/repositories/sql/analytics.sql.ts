import "server-only";
import { query } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Télémétrie CTA en SQL ciblé (mode PG). Append-only, non nominatif :
 * on n'enregistre que le nom de l'événement, un href optionnel et l'horodatage.
 */

export async function recordCtaEvent(event: string, href: string | null): Promise<void> {
  await query(
    "INSERT INTO cta_events (event, href, created_at) VALUES ($1, $2, NOW())",
    [event, href]
  );
}

export async function getCtaCounts(sinceDays: number): Promise<{ event: string; count: number }[]> {
  const res = await query<{ event: string; count: number }>(
    `SELECT event, COUNT(*)::int AS count
     FROM cta_events
     WHERE created_at >= NOW() - make_interval(days => $1)
     GROUP BY event
     ORDER BY count DESC`,
    [sinceDays]
  );
  return res.rows;
}
