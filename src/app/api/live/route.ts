import { getLiveEvents, getActiveLiveEvent } from "@/lib/live";
import { jsonData } from "@/lib/api-response";

export async function GET() {
  const events = getLiveEvents();
  const active = getActiveLiveEvent();
  return jsonData({ events, active });
}
