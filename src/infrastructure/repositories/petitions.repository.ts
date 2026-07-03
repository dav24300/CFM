import {
  getStore,
  updateStore,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { slugify } from "@/infrastructure/persistence/store.impl";
import { domainError } from "@/domain/errors/domain-error";
import type { Petition, PetitionSignature } from "@/domain/entities/v2";

export function getActivePetitions(): Petition[] {
  return getStore().petitions.filter((p) => p.active === 1);
}

export function getPetitionBySlug(slug: string): Petition | undefined {
  return getStore().petitions.find((p) => p.slug === slug && p.active === 1);
}

export function getPetitionById(id: number): Petition | undefined {
  return getStore().petitions.find((p) => p.id === id);
}

export function signPetition(data: {
  petition_id: number;
  user_id?: number;
  email: string;
  name: string;
}): void {
  updateStore((store) => {
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
}

export function createPetition(data: {
  title: string;
  description: string;
  content?: string;
  goal: number;
}): Petition {
  let created!: Petition;
  updateStore((store) => {
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
  return created!;
}

export function getPetitionSignatures(petitionId: number): PetitionSignature[] {
  return getStore().petition_signatures.filter((s) => s.petition_id === petitionId);
}
