"use client";

import { createContext, useContext } from "react";
import type { PortalRole } from "@/lib/portal-role";

export const PortalRoleContext = createContext<PortalRole>("famille");

/** Rôle "portail" courant (piloté par le sélecteur démo de la coquille). */
export function usePortalRole(): PortalRole {
  return useContext(PortalRoleContext);
}
