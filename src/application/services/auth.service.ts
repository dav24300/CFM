import { verifyPassword, createSession, destroySession } from "@/infrastructure/auth/admin-auth";
import { getAdminAccess, requireAdminAccess } from "@/lib/admin-access";
import { logAdminAction } from "@/lib/admin-audit";

export type { AdminAccess } from "@/lib/admin-access";

export async function adminLogin(
  password: string,
  ip: string | null
): Promise<boolean> {
  if (!verifyPassword(password)) {
    await logAdminAction({
      actorType: "unknown",
      endpoint: "/api/admin/login",
      action: "login",
      status: "denied",
      ip,
    });
    return false;
  }
  await createSession();
  await logAdminAction({
    actorType: "admin",
    endpoint: "/api/admin/login",
    action: "login",
    status: "success",
    ip,
  });
  return true;
}

export async function adminLogout(): Promise<void> {
  await destroySession();
}

export { getAdminAccess, requireAdminAccess };
