import {
  getActivePetitions,
  getPetitionBySlug,
  getPetitionById,
  signPetition,
  getPetitionSignatures,
  createPetition,
} from "@/infrastructure/repositories/petitions.repository";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import type { Petition } from "@/domain/entities/v2";

export function listActivePetitions(): Petition[] {
  return getActivePetitions();
}

export function getPetition(slug: string): Petition | undefined {
  return getPetitionBySlug(slug);
}

export async function signPetitionBySlug(
  slug: string,
  body: { email?: string; name?: string }
): Promise<void> {
  const petition = getPetitionBySlug(slug);
  if (!petition) throw new Error("NOT_FOUND");

  const member = await getCurrentMember();
  const email = (body.email || member?.email || "").trim();
  const name =
    (body.name || `${member?.first_name || ""} ${member?.last_name || ""}`).trim();

  if (!email || !name) throw new Error("MISSING_SIGNER");

  signPetition({
    petition_id: petition.id,
    user_id: member?.id,
    email,
    name,
  });
}

export {
  getPetitionById,
  getPetitionSignatures,
  createPetition,
};
