import { requireAdminRole } from "@/lib/admin-rest";
import { adminTestimonialCreateSchema } from "@/lib/validators/admin-api";
import { createContentCollectionRoutes } from "@/infrastructure/http/admin-content-routes";

export const { GET, POST } = createContentCollectionRoutes("testimonials", {
  guard: requireAdminRole,
  createSchema: adminTestimonialCreateSchema,
  // Iso-comportement : anonymous stocké en string ("0"/"1"), comme la route historique.
  transformCreate: (data) =>
    ({ ...data, anonymous: String(data.anonymous ?? 0) }) as Record<string, string>,
});
