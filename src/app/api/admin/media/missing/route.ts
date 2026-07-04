import { getAdminAccess } from "@/lib/admin-access";
import { jsonData, jsonUnauthorized } from "@/lib/api-response";
import { getMissingMedia } from "@/application/services/media.service";

export async function GET() {
  if (!(await getAdminAccess())) return jsonUnauthorized();
  return jsonData(getMissingMedia());
}
