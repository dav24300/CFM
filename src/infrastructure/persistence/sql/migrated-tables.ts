/**
 * Registre des tables migrées vers le SQL ciblé (repositories/sql/*).
 * Une table inscrite ici est ignorée par le sync différentiel du Store legacy
 * (pg-sync.ts) : plus aucune écriture Store ne peut la corrompre.
 * Chaque commit d'agrégat (C4+) ajoute ses tables à ce Set.
 */
const MIGRATED_TABLES = new Set<string>([
  "petitions",
  "petition_signatures",
  "newsletter",
  "push_subscriptions",
]);

export function isTableMigrated(table: string): boolean {
  return MIGRATED_TABLES.has(table);
}

export function listMigratedTables(): string[] {
  return [...MIGRATED_TABLES];
}

/** @internal Tests uniquement — remplace le contenu du registre. */
export function __setMigratedTablesForTests(tables: string[]): void {
  MIGRATED_TABLES.clear();
  for (const t of tables) MIGRATED_TABLES.add(t);
}
