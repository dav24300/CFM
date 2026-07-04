import { getLiveEvents, getActiveLiveEvent } from "@/lib/live";
import { jsonData } from "@/lib/api-response";

export async function GET() {
  const events = await getLiveEvents();
  const active = await getActiveLiveEvent();
  return jsonData({ events, active });
}
