import { getAdminStats } from "@/infrastructure/repositories/content.repository";
import { jsonData } from "@/infrastructure/http/api-response";
import { requireAdminRole } from "@/lib/admin-rest";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  return jsonData(await getAdminStats());
}
