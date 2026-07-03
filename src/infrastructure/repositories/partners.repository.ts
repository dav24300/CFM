import {
  getStore,
  updateStore,
  nextId,
} from "@/infrastructure/persistence/store-access";
import type { Partner } from "@/domain/entities/content";

export function getAllPartners(): Partner[] {
  return [...getStore().partners].sort((a, b) => a.sort_order - b.sort_order);
}

export function adminCreatePartner(data: {
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
  sort_order?: number;
}): Partner {
  let created!: Partner;
  updateStore((store) => {
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
  return created!;
}

export function adminUpdatePartner(
  id: number,
  data: Partial<Omit<Partner, "id">>
): boolean {
  let found = false;
  updateStore((store) => {
    const p = store.partners.find((x) => x.id === id);
    if (!p) return;
    found = true;
    if (data.name !== undefined) p.name = data.name;
    if (data.logo_url !== undefined) p.logo_url = data.logo_url;
    if (data.website !== undefined) p.website = data.website;
    if (data.description !== undefined) p.description = data.description;
    if (data.sort_order !== undefined) p.sort_order = data.sort_order;
  });
  return found;
}

export function adminDeletePartner(id: number): void {
  updateStore((store) => {
    store.partners = store.partners.filter((p) => p.id !== id);
  });
}
