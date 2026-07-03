import { readAuditLogs } from "@/lib/admin-audit";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData } from "@/lib/api-response";

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;
  const entries = await readAuditLogs(200);
  return jsonData({ entries });
}
