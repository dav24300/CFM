import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData } from "@/lib/api-response";
import { getMissingMedia } from "@/application/services/media.service";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  return jsonData(getMissingMedia());
}
