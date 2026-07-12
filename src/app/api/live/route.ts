import { getLiveEvents, getActiveLiveEvent } from "@/infrastructure/repositories/live.repository";
import { jsonData } from "@/infrastructure/http/api-response";

export async function GET() {
  const events = await getLiveEvents();
  const active = await getActiveLiveEvent();
  return jsonData({ events, active });
}
