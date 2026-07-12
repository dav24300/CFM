import { getActionsCached } from "@/infrastructure/cache/content-cache";
import { jsonData } from "@/infrastructure/http/api-response";

export async function GET() {
  const actions = await getActionsCached();
  return jsonData(actions);
}
