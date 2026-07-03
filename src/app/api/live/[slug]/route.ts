import { getLiveEventBySlug, incrementViewerCount } from "@/lib/live";
import { getPollsForEvent } from "@/lib/live";
import { jsonData, jsonError } from "@/lib/api-response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const event = getLiveEventBySlug(slug);
  if (!event) {
    return jsonError("Événement introuvable", 404);
  }
  if (event.status === "live" || event.status === "replay") {
    incrementViewerCount(event.id);
  }
  const polls = getPollsForEvent(event.id).filter((p) => p.active === 1);
  return jsonData({ event, polls });
}
