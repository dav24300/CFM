"use client";

import { createContext, useContext } from "react";
import type { PortalRole } from "@/lib/portal-role";

export const PortalRoleContext = createContext<PortalRole>("famille");

/** Rôle "portail" courant (fourni par le serveur — rôle de session, non modifiable côté client). */
export function usePortalRole(): PortalRole {
  return useContext(PortalRoleContext);
}
