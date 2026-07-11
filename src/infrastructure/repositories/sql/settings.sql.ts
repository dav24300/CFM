import "server-only";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query, withTransaction } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat « site_settings » en SQL ciblé (mode PG) — dernier agrégat migré.
 * Table clé/valeur : key VARCHAR PRIMARY KEY, value TEXT NOT NULL.
 * Le patch est un upsert par clé et NE SUPPRIME JAMAIS de clés existantes
 * (parité avec la branche Store qui fusionne le patch dans l'objet).
 */

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const res = await query<{ key: string; value: string }>(
      "SELECT key, value FROM site_settings ORDER BY key ASC"
    );
    const out: Record<string, string> = {};
    for (const row of res.rows) out[row.key] = row.value;
    return out;
  } catch (err) {
    mapPgError(err);
  }
}

export async function getSetting(key: string): Promise<string | undefined> {
  try {
    const res = await query<{ value: string }>(
      "SELECT value FROM site_settings WHERE key = $1",
      [key]
    );
    return res.rows[0]?.value;
  } catch (err) {
    mapPgError(err);
  }
}

const UPSERT_SQL = `INSERT INTO site_settings (key, value) VALUES ($1, $2)
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`;

/** Fusionne un patch (upsert clé par clé, aucun prune). Patch vide : no-op. */
export async function patchSettings(patch: Record<string, string>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;
  try {
    await withTransaction(async (client) => {
      for (const [key, value] of entries) {
        await client.query(UPSERT_SQL, [key, value]);
      }
    });
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Read-modify-write atomique d'un réglage (ex. media_catalog) : verrouille la
 * ligne (SELECT ... FOR UPDATE), applique mutateFn puis upsert — deux mutations
 * concurrentes du catalogue média sont sérialisées au lieu de se perdre.
 * Clé absente : un placeholder est inséré d'abord (ON CONFLICT DO NOTHING) pour
 * matérialiser la ligne à verrouiller ; mutateFn reçoit alors `undefined`,
 * comme la branche Store quand la clé n'existe pas encore.
 */
export async function patchSettingWithinTransaction(
  key: string,
  mutateFn: (current: string | undefined) => string
): Promise<void> {
  try {
    await withTransaction(async (client) => {
      const placeholder = await client.query(
        "INSERT INTO site_settings (key, value) VALUES ($1, '') ON CONFLICT (key) DO NOTHING",
        [key]
      );
      const createdNow = (placeholder.rowCount ?? 0) > 0;
      const res = await client.query<{ value: string }>(
        "SELECT value FROM site_settings WHERE key = $1 FOR UPDATE",
        [key]
      );
      const current = createdNow ? undefined : res.rows[0]?.value;
      await client.query(UPSERT_SQL, [key, mutateFn(current)]);
    });
  } catch (err) {
    mapPgError(err);
  }
}
