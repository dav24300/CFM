import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { slugify } from "@/infrastructure/persistence/store-seed";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlPetitions from "@/infrastructure/repositories/sql/petitions.sql";
import { invalidatePetitionsCache } from "@/infrastructure/cache/invalidate";
import { domainError } from "@/domain/errors/domain-error";
import type { Petition, PetitionSignature } from "@/domain/entities/v2";

/**
 * Agrégat pétitions — dual-mode :
 * - PG (DATABASE_URL) : SQL ciblé (sql/petitions.sql.ts), transactions +
 *   contrainte unique idx_petition_sig_unique — concurrent-safe.
 * - JSON (dev) : branche Store historique inchangée.
 * Validation et invalidation de cache restent communes.
 */

export async function getActivePetitions(): Promise<Petition[]> {
  if (isPgMode()) return sqlPetitions.getActivePetitions();
  const store = await getStoreAsync();
  return store.petitions.filter((p) => p.active === 1);
}

export async function getAllPetitions(): Promise<Petition[]> {
  if (isPgMode()) return sqlPetitions.getAllPetitions();
  const store = await getStoreAsync();
  return [...store.petitions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getPetitionBySlug(slug: string): Promise<Petition | undefined> {
  if (isPgMode()) return sqlPetitions.getPetitionBySlug(slug);
  const store = await getStoreAsync();
  return store.petitions.find((p) => p.slug === slug && p.active === 1);
}

export async function getPetitionById(id: number): Promise<Petition | undefined> {
  if (isPgMode()) return sqlPetitions.getPetitionById(id);
  const store = await getStoreAsync();
  return store.petitions.find((p) => p.id === id);
}

export async function signPetition(data: {
  petition_id: number;
  user_id?: number;
  email: string;
  name: string;
}): Promise<void> {
  if (isPgMode()) {
    await sqlPetitions.signPetition(data);
  } else {
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
  }
  invalidatePetitionsCache();
}

export async function createPetition(data: {
  title: string;
  description: string;
  content?: string;
  goal: number;
}): Promise<Petition> {
  let created!: Petition;
  if (isPgMode()) {
    created = await sqlPetitions.createPetition(data);
  } else {
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
  }
  invalidatePetitionsCache();
  return created!;
}

export async function updatePetition(
  id: number,
  data: Partial<Pick<Petition, "title" | "slug" | "description" | "content" | "goal" | "active">>
): Promise<boolean> {
  let found = false;
  if (isPgMode()) {
    found = await sqlPetitions.updatePetition(id, data);
  } else {
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
  }
  if (found) invalidatePetitionsCache();
  return found;
}

export async function deletePetition(id: number): Promise<boolean> {
  let found = false;
  if (isPgMode()) {
    found = await sqlPetitions.deletePetition(id);
  } else {
    await updateStoreAsync((store) => {
      const before = store.petitions.length;
      store.petitions = store.petitions.filter((p) => p.id !== id);
      store.petition_signatures = store.petition_signatures.filter(
        (s) => s.petition_id !== id
      );
      found = store.petitions.length < before;
    });
  }
  if (found) invalidatePetitionsCache();
  return found;
}

/**
 * Compteurs pétitions pour le tableau de bord admin.
 * `seenAtIso` : dernier horodatage vu par l'admin — les signatures plus
 * récentes sont comptées comme nouvelles (tout est nouveau si invalide).
 */
export async function getPetitionAdminCounters(seenAtIso: string): Promise<{
  petitions: number;
  signatures: number;
  newSignatures: number;
}> {
  if (isPgMode()) return sqlPetitions.getPetitionAdminCounters(seenAtIso);
  const store = await getStoreAsync();
  const seenAt = Date.parse(seenAtIso);
  const signatures = store.petition_signatures || [];
  const newSignatures = signatures.filter((s) => {
    const ts = Date.parse(s.signed_at);
    if (!Number.isFinite(ts)) return false;
    if (!Number.isFinite(seenAt)) return true;
    return ts > seenAt;
  }).length;
  return {
    petitions: (store.petitions || []).length,
    signatures: signatures.length,
    newSignatures,
  };
}

export async function getPetitionSignatures(
  petitionId: number
): Promise<PetitionSignature[]> {
  if (isPgMode()) return sqlPetitions.getPetitionSignatures(petitionId);
  const store = await getStoreAsync();
  return store.petition_signatures.filter((s) => s.petition_id === petitionId);
}
