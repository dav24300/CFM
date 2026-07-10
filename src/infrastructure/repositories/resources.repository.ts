import { getStoreAsync } from "@/infrastructure/persistence/store-access";
import type { MemberResource } from "@/domain/entities/v4";

/** Toutes les ressources membres, les plus récentes d'abord. */
export async function getAllResources(): Promise<MemberResource[]> {
  const store = await getStoreAsync();
  return [...(store.member_resources ?? [])].reverse();
}

/** Ressources groupées par catégorie (Record<catégorie, MemberResource[]>). */
export async function getResourcesByCategory(): Promise<
  Record<string, MemberResource[]>
> {
  const store = await getStoreAsync();
  const grouped: Record<string, MemberResource[]> = {};
  for (const resource of store.member_resources ?? []) {
    const key = resource.category || "Autre";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(resource);
  }
  return grouped;
}
