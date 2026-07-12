import { getActivePetitions } from "@/infrastructure/repositories/petitions.repository";
import { jsonData } from "@/infrastructure/http/api-response";

export async function GET() {
  return jsonData(await getActivePetitions());
}
