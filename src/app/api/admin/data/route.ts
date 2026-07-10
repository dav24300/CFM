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
import { jsonData, jsonUnauthorized } from "@/lib/api-response";

export async function GET() {
  if (!(await getAdminAccess())) {
    return jsonUnauthorized();
  }

  const base = await getAdminData();
  const users = (await getAllUsers()).map((u) => {
    const { password_hash: _, ...pub } = u;
    return pub;
  });
  const familyLinksRaw = await getAllFamilyLinks();
  const familyLinks = await Promise.all(
    familyLinksRaw.map(async (l) => ({
      ...l,
      parent: await getUserById(l.parent_user_id),
      child: await getUserById(l.child_user_id),
    }))
  );
  const petitions = await Promise.all(
    (await getAllPetitions()).map(async (p) => ({
      ...p,
      signatures: (await getPetitionSignatures(p.id)).length,
    }))
  );

  return jsonData({
    ...base,
    users,
    family_links: familyLinks,
    donations: await getAllDonations(),
    petitions,
  });
}
