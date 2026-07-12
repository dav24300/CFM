import { NextRequest } from "next/server";
import { voteLivePoll } from "@/infrastructure/repositories/live.repository";
import { cookies } from "next/headers";
import { jsonData, jsonError } from "@/infrastructure/http/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; pollId: string }> }
) {
  try {
    const { pollId } = await params;
    const { optionId } = await request.json();
    if (!optionId) {
      return jsonError("Option requise", 400);
    }

    const cookieStore = await cookies();
    let voterKey = cookieStore.get("cfm_voter")?.value;
    if (!voterKey) {
      voterKey = `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    const poll = await voteLivePoll(parseInt(pollId, 10), optionId, voterKey);
    const res = jsonData({ poll });
    res.cookies.set("cfm_voter", voterKey, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  } catch (err) {
    const code = err instanceof Error ? err.message : "Erreur";
    const errors: Record<string, string> = {
      ALREADY_VOTED: "Vous avez déjà voté",
      POLL_CLOSED: "Sondage fermé",
      INVALID_OPTION: "Option invalide",
    };
    return jsonError(errors[code] || "Erreur", 400);
  }
}
