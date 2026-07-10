import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { slugify } from "@/infrastructure/persistence/store-seed";
import { invalidatePetitionsCache } from "@/infrastructure/cache/invalidate";
import { domainError } from "@/domain/errors/domain-error";
import type { Petition, PetitionSignature } from "@/domain/entities/v2";

export async function getActivePetitions(): Promise<Petition[]> {
  const store = await getStoreAsync();
  return store.petitions.filter((p) => p.active === 1);
}

export async function getAllPetitions(): Promise<Petition[]> {
  const store = await getStoreAsync();
  return [...store.petitions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getPetitionBySlug(slug: string): Promise<Petition | undefined> {
  const store = await getStoreAsync();
  return store.petitions.find((p) => p.slug === slug && p.active === 1);
}

export async function getPetitionById(id: number): Promise<Petition | undefined> {
  const store = await getStoreAsync();
  return store.petitions.find((p) => p.id === id);
}

export async function signPetition(data: {
  petition_id: number;
  user_id?: number;
  email: string;
  name: string;
}): Promise<void> {
  await updateStoreAsync((store) => {
    const petition = store.petitions.find((p) => p.id === data.petition_id);
    if (!petition || petition.active !== 1) throw domainError("NOT_FOUND");

    const exists = store.petition_signatures.some(
      (s) =>
        s.petition_id === data.petition_id &&
        s.email.toLowerCase() === data.email.toLowerCase()
    );
    if (exists) throw domainError("ALREADY_SIGNED");

    store.petition_signatures.push({
      id: nextId(store),
      petition_id: data.petition_id,
      user_id: data.user_id || null,
      email: data.email.trim().toLowerCase(),
      name: data.name,
      signed_at: new Date().toISOString(),
    });
    petition.signatures_count += 1;
  });
  invalidatePetitionsCache();
}

export async function createPetition(data: {
  title: string;
  description: string;
  content?: string;
  goal: number;
}): Promise<Petition> {
  let created!: Petition;
  await updateStoreAsync((store) => {
    created = {
      id: nextId(store),
      title: data.title,
      slug: slugify(data.title),
      description: data.description,
      content: data.content || null,
      goal: data.goal,
      signatures_count: 0,
      active: 1,
      created_at: new Date().toISOString(),
    };
    store.petitions.push(created);
  });
  invalidatePetitionsCache();
  return created!;
}

export async function updatePetition(
  id: number,
  data: Partial<Pick<Petition, "title" | "slug" | "description" | "content" | "goal" | "active">>
): Promise<boolean> {
  let found = false;
  await updateStoreAsync((store) => {
    const p = store.petitions.find((x) => x.id === id);
    if (!p) return;
    found = true;
    if (data.title !== undefined) p.title = data.title;
    if (data.slug !== undefined) p.slug = data.slug;
    if (data.description !== undefined) p.description = data.description;
    if (data.content !== undefined) p.content = data.content;
    if (data.goal !== undefined) p.goal = data.goal;
    if (data.active !== undefined) p.active = data.active;
  });
  if (found) invalidatePetitionsCache();
  return found;
}

export async function deletePetition(id: number): Promise<boolean> {
  let found = false;
  await updateStoreAsync((store) => {
    const before = store.petitions.length;
    store.petitions = store.petitions.filter((p) => p.id !== id);
    store.petition_signatures = store.petition_signatures.filter((s) => s.petition_id !== id);
    found = store.petitions.length < before;
  });
  if (found) invalidatePetitionsCache();
  return found;
}

export async function getPetitionSignatures(
  petitionId: number
): Promise<PetitionSignature[]> {
  const store = await getStoreAsync();
  return store.petition_signatures.filter((s) => s.petition_id === petitionId);
}
