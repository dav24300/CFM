import { requireAdminRole } from "@/lib/admin-rest";
import { getAdminData } from "@/infrastructure/repositories/content.repository";
import { getAllUsers } from "@/infrastructure/repositories/users.repository";
import { getAllDonations } from "@/infrastructure/repositories/donations.repository";
import { getAllFamilyLinks } from "@/infrastructure/repositories/family-links.repository";
import {
  getAllPetitions,
  getPetitionSignatures,
} from "@/infrastructure/repositories/petitions.repository";
import { jsonData } from "@/infrastructure/http/api-response";

export async function GET() {
  // Dump complet (PII membres, dons, signatures) : réservé à l'admin, jamais volunteer.
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  // Les 5 sources sont indépendantes : lecture en parallèle, plus en cascade.
  const [base, allUsers, familyLinksRaw, allPetitions, donations] = await Promise.all([
    getAdminData(),
    getAllUsers(),
    getAllFamilyLinks(),
    getAllPetitions(),
    getAllDonations(),
  ]);

  const seenAtRaw = String((base as { site_settings?: Record<string, string> }).site_settings?.petition_signatures_seen_at || "");
  const seenAt = Date.parse(seenAtRaw);
  const stripHash = <T extends { password_hash?: unknown }>(u: T | undefined) => {
    if (!u) return u;
    const { password_hash: _omit, ...rest } = u;
    return rest;
  };
  const users = allUsers.map((u) => stripHash(u)!);

  // Les utilisateurs sont déjà tous chargés : les résoudre via une Map plutôt
  // que par 2 `getUserById` par lien (N+1 — 1000 requêtes pour 500 liens).
  const usersById = new Map(users.map((u) => [u.id, u]));
  const familyLinks = familyLinksRaw.map((l) => ({
    ...l,
    parent: usersById.get(l.parent_user_id),
    child: usersById.get(l.child_user_id),
  }));

  // Signatures chargées UNE fois par pétition (auparavant deux fois : une pour
  // `.length`, une pour la liste — et `getAllPetitions()` était lui-même
  // appelé deux fois).
  const signaturesByPetition = await Promise.all(
    allPetitions.map((p) => getPetitionSignatures(p.id))
  );

  const petitions = allPetitions.map((p, i) => ({
    ...p,
    signatures: signaturesByPetition[i].length,
  }));

  const petitionSignatures = allPetitions
    .flatMap((petition, i) =>
      signaturesByPetition[i].map((signature) => ({
        ...signature,
        petition_title: petition.title,
        petition_slug: petition.slug,
        is_new: Number.isFinite(Date.parse(signature.signed_at))
          ? (!Number.isFinite(seenAt) || Date.parse(signature.signed_at) > seenAt)
          : true,
      }))
    )
    .sort(
      (a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime()
    );

  return jsonData({
    ...base,
    users,
    family_links: familyLinks,
    donations,
    petitions,
    petition_signatures: petitionSignatures,
  });
}
