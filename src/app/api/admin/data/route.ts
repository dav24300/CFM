import { getAdminAccess } from "@/lib/admin-access";
import { getAdminData } from "@/lib/db";
import {
  getAllUsers,
  getAllDonations,
  getAllFamilyLinks,
  getActivePetitions,
  getPetitionSignatures,
  getUserById,
} from "@/lib/members";
import { jsonData, jsonUnauthorized } from "@/lib/api-response";

export async function GET() {
  if (!(await getAdminAccess())) {
    return jsonUnauthorized();
  }

  const base = getAdminData();
  const users = getAllUsers().map((u) => {
    const { password_hash: _, ...pub } = u;
    return pub;
  });
  const familyLinks = getAllFamilyLinks().map((l) => ({
    ...l,
    parent: getUserById(l.parent_user_id),
    child: getUserById(l.child_user_id),
  }));
  const petitions = getActivePetitions().map((p) => ({
    ...p,
    signatures: getPetitionSignatures(p.id).length,
  }));

  return jsonData({
    ...base,
    users,
    family_links: familyLinks,
    donations: getAllDonations(),
    petitions,
  });
}
