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

export async function getPetitionSignatures(
  petitionId: number
): Promise<PetitionSignature[]> {
  const store = await getStoreAsync();
  return store.petition_signatures.filter((s) => s.petition_id === petitionId);
}
