import { destroySession } from "@/infrastructure/auth/admin-auth";
import { getAdminAccess, requireAdminAccess } from "@/lib/admin-access";

export type { AdminAccess } from "@/lib/admin-access";

export async function adminLogout(): Promise<void> {
  await destroySession();
}

export { getAdminAccess, requireAdminAccess };
