import { getActionsCached } from "@/infrastructure/cache/content-cache";
import { jsonData } from "@/lib/api-response";

export async function GET() {
  const actions = await getActionsCached();
  return jsonData(actions);
}
