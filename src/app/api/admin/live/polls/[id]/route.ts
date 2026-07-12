import { NextRequest, NextResponse } from "next/server";
import { closeLivePoll, getPollById, getPollVotes } from "@/lib/live";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData, jsonNotFound, jsonSuccess } from "@/lib/api-response";
import { parseOrBadRequest } from "@/lib/validators";
import { z } from "@/lib/validators";

const patchSchema = z.object({
  active: z.union([z.literal(0), z.literal(1)]).optional(),
});

function pollToCsv(
  poll: { question: string; options: { id: string; text: string; votes: number }[] },
  votes: { option_id: string; voter_key: string; created_at: string }[]
): string {
  const lines = ["question,option,votes"];
  for (const opt of poll.options) {
    lines.push(
      `"${poll.question.replace(/"/g, '""')}","${opt.text.replace(/"/g, '""')}",${opt.votes}`
    );
  }
  lines.push("");
  lines.push("voter_key,option_id,created_at");
  for (const v of votes) {
    lines.push(`${v.voter_key},${v.option_id},${v.created_at}`);
  }
  return lines.join("\n");
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const pollId = parseInt((await params).id, 10);
  if (!Number.isFinite(pollId)) return jsonNotFound("Sondage introuvable");
  const poll = await getPollById(pollId);
  if (!poll) return jsonNotFound("Sondage introuvable");

  const votes = await getPollVotes(pollId);
  const format = request.nextUrl.searchParams.get("format");

  if (format === "csv") {
    const csv = pollToCsv(poll, votes);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="cfm-poll-${pollId}.csv"`,
      },
    });
  }

  return jsonData({ poll, votes });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const parsed = parseOrBadRequest(patchSchema, await request.json());
  if (!parsed.ok) return parsed.response;

  const pollId = parseInt((await params).id, 10);
  if (!Number.isFinite(pollId)) return jsonNotFound("Sondage introuvable");
  if (parsed.data.active === 0) {
    const poll = await closeLivePoll(pollId);
    if (!poll) return jsonNotFound("Sondage introuvable");
    return jsonSuccess({ poll });
  }

  return jsonNotFound("Action non supportée");
}
