import { readAuditLogs } from "@/lib/admin-audit";
import { requireAdminRole } from "@/lib/admin-rest";
import { jsonData } from "@/lib/api-response";

export async function GET() {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;
  const entries = await readAuditLogs(200);
  return jsonData({ entries });
}
