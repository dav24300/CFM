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

export async function listActivePetitions(): Promise<Petition[]> {
  return getActivePetitions();
}

export async function getPetition(slug: string): Promise<Petition | undefined> {
  return getPetitionBySlug(slug);
}

export async function signPetitionBySlug(
  slug: string,
  body: { email?: string; name?: string }
): Promise<{ signatures_count: number }> {
  const petition = await getPetitionBySlug(slug);
  if (!petition) throw new Error("NOT_FOUND");

  const member = await getCurrentMember();
  const email = (body.email || member?.email || "").trim();
  const name =
    (body.name || `${member?.first_name || ""} ${member?.last_name || ""}`).trim();

  if (!email || !name) throw new Error("MISSING_SIGNER");

  // Le total à jour remonte jusqu'au client : la route ne renvoyait que
  // `{success:true}`, si bien que le signataire continuait de voir l'ancien
  // compteur jusqu'au prochain rendu serveur.
  return signPetition({
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
