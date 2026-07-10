import type { PublicUser } from "@/domain/entities/v2";

export type PortalRole = "famille" | "benevole" | "coordinateur";

export const PORTAL_ROLE_LABELS: Record<PortalRole, string> = {
  famille: "Famille militaire",
  benevole: "Bénévole",
  coordinateur: "Coordinateur provincial",
};

/** Rôle "portail" dérivé du User (role + membership_type). */
export function portalRole(user: Pick<PublicUser, "role" | "membership_type">): PortalRole {
  if (user.role === "coordinator") return "coordinateur";
  if (user.role === "volunteer" || user.membership_type === "benevole") return "benevole";
  return "famille";
}
