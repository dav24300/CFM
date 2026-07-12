import { getMemberDashboard } from "@/application/services/member.service";
import { jsonData, jsonUnauthorized } from "@/infrastructure/http/api-response";

export async function GET() {
  const data = await getMemberDashboard();
  if (!data) return jsonUnauthorized("Non connecté");
  return jsonData(data);
}
