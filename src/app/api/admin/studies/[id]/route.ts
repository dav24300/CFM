import { requireAdminRole } from "@/lib/admin-rest";
import { adminStudyPatchSchema } from "@/lib/validators/admin-api";
import { createContentItemRoutes } from "@/infrastructure/http/admin-content-routes";

export const { GET, PATCH, DELETE } = createContentItemRoutes("studies", {
  guard: requireAdminRole,
  patchSchema: adminStudyPatchSchema,
});
