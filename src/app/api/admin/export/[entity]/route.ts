import { getAdminData } from "@/lib/db";
import { getAllDonations, getAllUsers } from "@/lib/members";
import { requireAdminRole } from "@/lib/admin-rest";
import { jsonError, jsonNotFound } from "@/lib/api-response";
import { csvCell } from "@/lib/csv";

const EXPORTERS: Record<string, () => Promise<Record<string, unknown>[]>> = {
  newsletter: async () => (await getAdminData()).newsletter,
  memberships: async () => (await getAdminData()).memberships,
  contacts: async () => (await getAdminData()).contacts,
  help_requests: async () => (await getAdminData()).help_requests,
  news: async () => (await getAdminData()).news,
  donations: async () => (await getAllDonations()) as unknown as Record<string, unknown>[],
  users: async () => {
    const users = await getAllUsers();
    return users.map(({ password_hash: _, ...pub }) => pub) as unknown as Record<string, unknown>[];
  },
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const lines = [keys.map((k) => csvCell(k)).join(",")];
  for (const row of rows) {
    lines.push(keys.map((k) => csvCell(row[k])).join(","));
  }
  return lines.join("\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const auth = await requireAdminRole();
  if (!auth.ok) return auth.response;

  const { entity } = await params;
  const exporter = EXPORTERS[entity];
  if (!exporter) return jsonError("Entité inconnue", 404);

  const rows = await exporter();
  const csv = toCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cfm-${entity}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
