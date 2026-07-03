import { getMemberDashboard } from "@/application/services/member.service";
import { jsonData, jsonUnauthorized } from "@/lib/api-response";

export async function GET() {
  const data = await getMemberDashboard();
  if (!data) return jsonUnauthorized("Non connecté");
  return jsonData(data);
}
