import { getAdminAccess } from "@/lib/admin-access";
import { getAdminData } from "@/lib/db";
import {
  getAllUsers,
  getAllDonations,
  getAllFamilyLinks,
  getAllPetitions,
  getPetitionSignatures,
  getUserById,
} from "@/lib/members";
import { jsonData, jsonForbidden, jsonUnauthorized } from "@/lib/api-response";

export async function GET() {
  const access = await getAdminAccess();
  if (!access) return jsonUnauthorized();
  // Dump complet (PII membres, dons, signatures) : réservé à l'admin, jamais volunteer.
  if (access !== "admin") return jsonForbidden();

  const base = await getAdminData();
  const seenAtRaw = String((base as { site_settings?: Record<string, string> }).site_settings?.petition_signatures_seen_at || "");
  const seenAt = Date.parse(seenAtRaw);
  const users = (await getAllUsers()).map((u) => {
    const { password_hash: _, ...pub } = u;
    return pub;
  });
  const stripHash = <T extends { password_hash?: unknown }>(u: T | undefined) => {
    if (!u) return u;
    const { password_hash: _omit, ...rest } = u;
    return rest;
  };
  const familyLinksRaw = await getAllFamilyLinks();
  const familyLinks = await Promise.all(
    familyLinksRaw.map(async (l) => ({
      ...l,
      parent: stripHash(await getUserById(l.parent_user_id)),
      child: stripHash(await getUserById(l.child_user_id)),
    }))
  );
  const petitions = await Promise.all(
    (await getAllPetitions()).map(async (p) => ({
      ...p,
      signatures: (await getPetitionSignatures(p.id)).length,
    }))
  );
  const petitionSignatures = (
    await Promise.all(
      (await getAllPetitions()).map(async (petition) =>
        (await getPetitionSignatures(petition.id)).map((signature) => ({
          ...signature,
          petition_title: petition.title,
          petition_slug: petition.slug,
          is_new: Number.isFinite(Date.parse(signature.signed_at))
            ? (!Number.isFinite(seenAt) || Date.parse(signature.signed_at) > seenAt)
            : true,
        }))
      )
    )
  )
    .flat()
    .sort(
      (a, b) => new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime()
    );

  return jsonData({
    ...base,
    users,
    family_links: familyLinks,
    donations: await getAllDonations(),
    petitions,
    petition_signatures: petitionSignatures,
  });
}
