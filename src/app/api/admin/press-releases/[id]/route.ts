import { requireAdminRole } from "@/lib/admin-rest";
import { adminPressPatchSchema } from "@/lib/validators/admin-api";
import { createContentItemRoutes } from "@/infrastructure/http/admin-content-routes";

export const { GET, PATCH, DELETE } = createContentItemRoutes("press_releases", {
  guard: requireAdminRole,
  patchSchema: adminPressPatchSchema,
});
