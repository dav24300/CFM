import { getActivePetitions } from "@/lib/members";
import { jsonData } from "@/lib/api-response";

export async function GET() {
  return jsonData(getActivePetitions());
}
