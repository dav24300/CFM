import "server-only";
import { seedDefaultLiveEventIfEmpty } from "@/infrastructure/repositories/sql/live.sql";
import { seedDefaultPetitionsIfEmpty } from "@/infrastructure/repositories/sql/petitions.sql";
import { seedDefaultPortalDataIfEmpty } from "@/infrastructure/repositories/sql/portal.sql";

/**
 * Seeds SQL des agrégats migrés (leurs tables ne sont plus couvertes par le
 * sync Store → saveStoreToPostgres ne peut plus les seeder).
 * Appelé uniquement depuis le chemin claimSeedVersion du postgres-store.adapter
 * (one-shot, sérialisé par verrou advisory). Chaque agrégat migré porteur de
 * seeds ajoute son hook ici.
 */
export async function seedMigratedAggregates(): Promise<void> {
  await seedDefaultPetitionsIfEmpty();
  await seedDefaultLiveEventIfEmpty();
  await seedDefaultPortalDataIfEmpty();
}
