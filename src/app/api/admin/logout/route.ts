import { adminLogout } from "@/application/services/auth.service";
import { jsonSuccess } from "@/infrastructure/http/api-response";

export async function POST() {
  await adminLogout();
  return jsonSuccess();
}
