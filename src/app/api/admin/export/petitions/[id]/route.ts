import { NextRequest, NextResponse } from "next/server";
import { getAdminAccess } from "@/lib/admin-access";
import { getPetitionById, getPetitionSignatures } from "@/lib/members";
import { petitionSignaturesToCsv } from "@/lib/password-reset";
import { jsonError, jsonUnauthorized } from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAdminAccess())) {
    return jsonUnauthorized();
  }

  const { id } = await params;
  const petitionId = parseInt(id, 10);
  const petition = getPetitionById(petitionId);
  if (!petition) {
    return jsonError("Pétition introuvable", 404);
  }

  const signatures = getPetitionSignatures(petitionId).map((s) => ({
    name: s.name,
    email: s.email,
    signed_at: s.signed_at,
  }));

  const csv = petitionSignaturesToCsv(petition.title, signatures);
  const filename = `cfm-petition-${petition.slug}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
