import { getAdminAccess } from "@/lib/admin-access";
import { jsonForbidden, jsonUnauthorized } from "@/infrastructure/http/api-response";

export async function requireAdminRole() {
  const access = await getAdminAccess();
  if (!access) return { ok: false as const, response: jsonUnauthorized() };
  if (access !== "admin") return { ok: false as const, response: jsonForbidden() };
  return { ok: true as const, access };
}

/** Admin fondateur ou bénévole quasi-admin */
export async function requireAdminAccess() {
  const access = await getAdminAccess();
  if (!access) return { ok: false as const, response: jsonUnauthorized() };
  return { ok: true as const, access };
}
