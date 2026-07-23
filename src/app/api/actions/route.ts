import { getActionsCached } from "@/infrastructure/cache/content-cache";
import { jsonPublicCached } from "@/infrastructure/http/api-response";

export async function GET() {
  const actions = await getActionsCached();
  return jsonPublicCached(actions);
}
