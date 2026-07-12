import { getVapidPublicKey } from "@/infrastructure/push/web-push.adapter";
import { jsonData } from "@/infrastructure/http/api-response";

export async function GET() {
  return jsonData({ publicKey: getVapidPublicKey() });
}
