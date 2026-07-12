import { requireAdminRole } from "@/lib/admin-rest";
import { adminCampaignPatchSchema } from "@/lib/validators/admin-api";
import { createContentItemRoutes } from "@/infrastructure/http/admin-content-routes";

export const { GET, PATCH, DELETE } = createContentItemRoutes("campaigns", {
  guard: requireAdminRole,
  patchSchema: adminCampaignPatchSchema,
});
