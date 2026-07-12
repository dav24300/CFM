import { logoutMember } from "@/application/services/member.service";
import { jsonSuccess } from "@/infrastructure/http/api-response";

export async function POST() {
  await logoutMember();
  return jsonSuccess();
}
