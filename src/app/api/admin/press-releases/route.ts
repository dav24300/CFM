import { requireAdminRole } from "@/lib/admin-rest";
import { adminPressCreateSchema } from "@/lib/validators/admin-api";
import { createContentCollectionRoutes } from "@/infrastructure/http/admin-content-routes";

export const { GET, POST } = createContentCollectionRoutes("press_releases", {
  guard: requireAdminRole,
  createSchema: adminPressCreateSchema,
});
