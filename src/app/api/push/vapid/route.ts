import { getVapidPublicKey } from "@/lib/push";
import { jsonData } from "@/lib/api-response";

export async function GET() {
  return jsonData({ publicKey: getVapidPublicKey() });
}
