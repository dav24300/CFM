import "server-only";
import { seedDefaultPetitionsIfEmpty } from "@/infrastructure/repositories/sql/petitions.sql";

/**
 * Seeds SQL des agrégats migrés (leurs tables ne sont plus couvertes par le
 * sync Store → saveStoreToPostgres ne peut plus les seeder).
 * Appelé uniquement depuis le chemin claimSeedVersion du postgres-store.adapter
 * (one-shot, sérialisé par verrou advisory). Chaque agrégat migré porteur de
 * seeds ajoute son hook ici (C10 : live ; C11 : events/member_resources).
 */
export async function seedMigratedAggregates(): Promise<void> {
  await seedDefaultPetitionsIfEmpty();
}
