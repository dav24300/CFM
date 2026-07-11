import "server-only";
import { CURRENT_SEED_VERSION } from "@/infrastructure/persistence/store-seed";
import {
  ensureSchemaOnce,
  isPgMode,
  withTransaction,
} from "@/infrastructure/persistence/sql/sql-client";
import { seedDefaultLiveEventIfEmpty } from "@/infrastructure/repositories/sql/live.sql";
import { seedDefaultPetitionsIfEmpty } from "@/infrastructure/repositories/sql/petitions.sql";
import { seedDefaultPortalDataIfEmpty } from "@/infrastructure/repositories/sql/portal.sql";

/**
 * Seeds SQL one-shot des agrégats (ZC-5) — appelés au démarrage du serveur
 * (instrumentation.ts) via ensurePgSeedsOnce. Le verrou advisory de
 * claimSeedVersion élimine la course multi-instances : une seule instance
 * seede, les autres constatent seed_version à jour.
 */

/**
 * Réclame l'application des seeds : sous verrou advisory, relit
 * store_meta.seed_version et le stampe à CURRENT_SEED_VERSION si (et
 * seulement si) il était inférieur. Retourne true si l'appelant doit seeder.
 */
export async function claimSeedVersion(): Promise<boolean> {
  if (!isPgMode()) return false;
  await ensureSchemaOnce();
  return withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('cfm_seed'))");
    const res = await client.query<{ seed_version: number | null }>(
      "SELECT seed_version FROM store_meta WHERE id = 1"
    );
    const current = res.rows[0]?.seed_version ?? 0;
    if (current >= CURRENT_SEED_VERSION) return false;
    await client.query(
      `INSERT INTO store_meta (id, seed_version) VALUES (1, $1)
       ON CONFLICT (id) DO UPDATE SET seed_version = $1, updated_at = NOW()`,
      [CURRENT_SEED_VERSION]
    );
    return true;
  });
}

export async function seedMigratedAggregates(): Promise<void> {
  await seedDefaultPetitionsIfEmpty();
  await seedDefaultLiveEventIfEmpty();
  await seedDefaultPortalDataIfEmpty();
}

let seedsEnsured = false;

/**
 * Point d'entrée démarrage serveur (instrumentation.ts) : schéma puis seeds
 * de démo one-shot. Non bloquant — un échec est journalisé, les routes
 * ré-appliqueront le schéma à la première requête (ensureSchemaOnce).
 */
export async function ensurePgSeedsOnce(): Promise<void> {
  if (seedsEnsured || !isPgMode()) return;
  seedsEnsured = true;
  try {
    await ensureSchemaOnce();
    if (await claimSeedVersion()) {
      await seedMigratedAggregates();
    }
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(
      JSON.stringify({ evt: "pg_seed_failed", detail, at: new Date().toISOString() })
    );
  }
}
