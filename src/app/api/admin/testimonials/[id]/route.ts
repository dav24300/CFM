import { requireAdminRole } from "@/lib/admin-rest";
import { adminTestimonialPatchSchema } from "@/lib/validators/admin-api";
import { createContentItemRoutes } from "@/infrastructure/http/admin-content-routes";

export const { GET, PATCH, DELETE } = createContentItemRoutes("testimonials", {
  guard: requireAdminRole,
  patchSchema: adminTestimonialPatchSchema,
  // Iso-comportement : anonymous normalisé en 0|1, comme la route historique.
  transformPatch: (patch) => {
    if (patch.anonymous !== undefined) patch.anonymous = Number(patch.anonymous) ? 1 : 0;
    return patch;
  },
});
