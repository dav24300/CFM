import { getLiveEventBySlug, incrementViewerCount } from "@/infrastructure/repositories/live.repository";
import { getPollsForEvent } from "@/infrastructure/repositories/live.repository";
import { jsonData, jsonError } from "@/infrastructure/http/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = await getLiveEventBySlug(slug);
  if (!event) {
    return jsonError("Événement introuvable", 404);
  }
  if (event.status === "live" || event.status === "replay") {
    await incrementViewerCount(event.id);
  }
  const polls = (await getPollsForEvent(event.id)).filter((p) => p.active === 1);
  return jsonData({ event, polls });
}
