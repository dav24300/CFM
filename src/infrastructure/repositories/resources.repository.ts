import { getStoreAsync } from "@/infrastructure/persistence/store-access";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlPortal from "@/infrastructure/repositories/sql/portal.sql";
import type { MemberResource } from "@/domain/entities/v4";

/**
 * Agrégat portail (ressources membres) — dual-mode :
 * - PG (DATABASE_URL) : SQL ciblé (sql/portal.sql.ts), lecture seule.
 * - JSON (dev) : branche Store historique inchangée.
 */

/** Toutes les ressources membres, les plus récentes d'abord. */
export async function getAllResources(): Promise<MemberResource[]> {
  if (isPgMode()) return sqlPortal.getAllResources();
  const store = await getStoreAsync();
  return [...(store.member_resources ?? [])].reverse();
}

/** Ressources groupées par catégorie (Record<catégorie, MemberResource[]>). */
export async function getResourcesByCategory(): Promise<
  Record<string, MemberResource[]>
> {
  if (isPgMode()) return sqlPortal.getResourcesByCategory();
  const store = await getStoreAsync();
  const grouped: Record<string, MemberResource[]> = {};
  for (const resource of store.member_resources ?? []) {
    const key = resource.category || "Autre";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(resource);
  }
  return grouped;
}
