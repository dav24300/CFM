import "server-only";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";
import { query } from "@/infrastructure/persistence/sql/sql-client";

type Subscriber = { id: number; email: string; created_at: string };

/** Agrégat newsletter en SQL ciblé (mode PG). */

export async function addSubscriber(email: string): Promise<void> {
  try {
    // Anti-doublon par idx_newsletter_email (lower(email)) → ALREADY_EXISTS.
    await query(
      "INSERT INTO newsletter (email, created_at) VALUES ($1, $2)",
      [email.trim().toLowerCase(), new Date().toISOString()]
    );
  } catch (err) {
    mapPgError(err);
  }
}

export async function deleteSubscriber(id: number): Promise<boolean> {
  try {
    const res = await query("DELETE FROM newsletter WHERE id = $1", [id]);
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    mapPgError(err);
  }
}

/** Liste id DESC — équivalent du [...store.newsletter].reverse() historique. */
export async function listSubscribersDesc(): Promise<Subscriber[]> {
  try {
    const res = await query<Subscriber>(
      "SELECT id, email, created_at FROM newsletter ORDER BY id DESC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function countSubscribers(): Promise<number> {
  try {
    const res = await query<{ n: number }>("SELECT COUNT(*)::int AS n FROM newsletter");
    return res.rows[0].n;
  } catch (err) {
    mapPgError(err);
  }
}
