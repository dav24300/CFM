import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { invalidatePartnersCache } from "@/infrastructure/cache/invalidate";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlContent from "@/infrastructure/repositories/sql/content.sql";
import type { Partner } from "@/domain/entities/content";

export async function getAllPartners(): Promise<Partner[]> {
  if (isPgMode()) return sqlContent.getAllPartnersSorted();
  const store = await getStoreAsync();
  return [...store.partners].sort((a, b) => a.sort_order - b.sort_order);
}

export async function adminCreatePartner(data: {
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
  sort_order?: number;
}): Promise<Partner> {
  if (isPgMode()) {
    const created = await sqlContent.createPartner(data);
    invalidatePartnersCache();
    return created;
  }
  let created!: Partner;
  await updateStoreAsync((store) => {
    created = {
      id: nextId(store),
      name: data.name,
      logo_url: data.logo_url || null,
      website: data.website || null,
      description: data.description || null,
      sort_order: data.sort_order ?? store.partners.length + 1,
    };
    store.partners.push(created);
  });
  invalidatePartnersCache();
  return created!;
}

export async function adminUpdatePartner(
  id: number,
  data: Partial<Omit<Partner, "id">>
): Promise<boolean> {
  if (isPgMode()) {
    const found = await sqlContent.updatePartner(id, data);
    if (found) invalidatePartnersCache();
    return found;
  }
  let found = false;
  await updateStoreAsync((store) => {
    const p = store.partners.find((x) => x.id === id);
    if (!p) return;
    found = true;
    if (data.name !== undefined) p.name = data.name;
    if (data.logo_url !== undefined) p.logo_url = data.logo_url;
    if (data.website !== undefined) p.website = data.website;
    if (data.description !== undefined) p.description = data.description;
    if (data.sort_order !== undefined) p.sort_order = data.sort_order;
  });
  if (found) invalidatePartnersCache();
  return found;
}

export async function adminDeletePartner(id: number): Promise<void> {
  if (isPgMode()) {
    // id inconnu : no-op mais invalidation quand même (parité Store).
    await sqlContent.deletePartner(id);
    invalidatePartnersCache();
    return;
  }
  await updateStoreAsync((store) => {
    store.partners = store.partners.filter((p) => p.id !== id);
  });
  invalidatePartnersCache();
}
