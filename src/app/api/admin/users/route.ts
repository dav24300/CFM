import { getAllUsers } from "@/infrastructure/repositories/users.repository";
import { jsonData } from "@/infrastructure/http/api-response";
import { requireAdminRole } from "@/lib/admin-rest";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const users = (await getAllUsers()).map((u) => {
    const { password_hash: _ignored, ...rest } = u;
    return rest;
  });
  return jsonData({ users });
}
