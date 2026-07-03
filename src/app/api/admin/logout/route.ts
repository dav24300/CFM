import { adminLogout } from "@/application/services/auth.service";
import { jsonSuccess } from "@/lib/api-response";

export async function POST() {
  await adminLogout();
  return jsonSuccess();
}
