import { getAdminData } from "@/lib/db";
import { getAllDonations } from "@/lib/members";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonError, jsonNotFound } from "@/lib/api-response";

const EXPORTERS: Record<string, () => Record<string, unknown>[]> = {
  newsletter: () => getAdminData().newsletter,
  memberships: () => getAdminData().memberships,
  contacts: () => getAdminData().contacts,
  help_requests: () => getAdminData().help_requests,
  news: () => getAdminData().news,
  donations: () => getAllDonations() as unknown as Record<string, unknown>[],
};

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [keys.join(",")];
  for (const row of rows) {
    lines.push(keys.map((k) => escape(row[k])).join(","));
  }
  return lines.join("\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ entity: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const { entity } = await params;
  const exporter = EXPORTERS[entity];
  if (!exporter) return jsonError("Entité inconnue", 404);

  const rows = exporter();
  const csv = toCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cfm-${entity}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
