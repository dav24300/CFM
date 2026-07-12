import { requireAdminRole } from "@/lib/admin-rest";
import { adminStudyCreateSchema } from "@/lib/validators/admin-api";
import { createContentCollectionRoutes } from "@/infrastructure/http/admin-content-routes";

export const { GET, POST } = createContentCollectionRoutes("studies", {
  guard: requireAdminRole,
  createSchema: adminStudyCreateSchema,
});
