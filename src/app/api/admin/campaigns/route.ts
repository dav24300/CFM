import { requireAdminRole } from "@/lib/admin-rest";
import { adminCampaignCreateSchema } from "@/lib/validators/admin-api";
import { createContentCollectionRoutes } from "@/infrastructure/http/admin-content-routes";

export const { GET, POST } = createContentCollectionRoutes("campaigns", {
  guard: requireAdminRole,
  createSchema: adminCampaignCreateSchema,
});
