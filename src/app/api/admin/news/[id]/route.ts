import { requireAdminAccess } from "@/lib/admin-rest";
import { adminNewsPatchSchema } from "@/lib/validators/admin-api";
import { updateNewsItem } from "@/infrastructure/repositories/content.repository";
import { createContentItemRoutes } from "@/infrastructure/http/admin-content-routes";

// Iso-comportement STRICT (route historique divergente) :
// - requireAdminAccess : bénévole quasi-admin autorisé (décision conservée) ;
// - 404 "Actualité introuvable" partout (id invalide, GET absent, PATCH absent),
//   là où les autres tables répondent 200 {item:null} en GET et "ID invalide" sinon ;
// - PATCH persisté via updateNewsItem (normalisation excerpt/category/cover_*).
export const { GET, PATCH, DELETE } = createContentItemRoutes("news", {
  guard: requireAdminAccess,
  patchSchema: adminNewsPatchSchema,
  invalidIdMessage: "Actualité introuvable",
  getNotFoundMessage: "Actualité introuvable",
  applyPatch: (id, data) => updateNewsItem(id, data),
  patchNotFoundMessage: "Actualité introuvable",
});
