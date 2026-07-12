import { requireAdminRole } from "@/lib/admin-rest";
import { adminNewsCreateSchema } from "@/lib/validators/admin-api";
import { createContentCollectionRoutes } from "@/infrastructure/http/admin-content-routes";

// Iso-comportement : la route collection news exigeait déjà requireAdminRole
// (seule la route détail [id] est ouverte aux bénévoles via requireAdminAccess).
export const { GET, POST } = createContentCollectionRoutes("news", {
  guard: requireAdminRole,
  createSchema: adminNewsCreateSchema,
});
