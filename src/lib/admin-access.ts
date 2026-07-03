import { isAuthenticated } from "@/infrastructure/auth/admin-auth";
import { isVolunteerSession } from "@/infrastructure/auth/member-auth";
import { domainError } from "@/domain/errors/domain-error";

export type AdminAccess = "admin" | "volunteer" | null;

export async function getAdminAccess(): Promise<AdminAccess> {
  if (await isAuthenticated()) return "admin";
  if (await isVolunteerSession()) return "volunteer";
  return null;
}

export async function requireAdminAccess(): Promise<AdminAccess> {
  const access = await getAdminAccess();
  if (!access) throw domainError("UNAUTHORIZED");
  return access;
}
