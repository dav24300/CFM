import { getAdminStats } from "@/lib/db";
import { jsonData } from "@/lib/api-response";
import { requireAdminRole } from "@/lib/admin-rest";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  return jsonData(await getAdminStats());
}
