/** @deprecated Utiliser @/application/services/content.service ou repositories */
export {
  addNewsletter,
  addMembership,
  addHelpRequest,
  addContactMessage,
  getHelpRequestById,
  getAdminStats,
  getAdminData,
  adminCreate,
  adminUpdateStatus,
  adminDelete,
} from "@/infrastructure/repositories/content.repository";

export type {
  News,
  Study,
  Campaign,
  Testimonial,
  Action,
  PressRelease,
} from "@/infrastructure/repositories/content.repository";

/** Lectures publiques mises en cache (Next.js Data Cache, TTL 5 min). */
export {
  getPublishedNewsCached as getPublishedNews,
  getPublishedStudiesCached as getPublishedStudies,
  getActiveCampaignsCached as getActiveCampaigns,
  getPublishedTestimonialsCached as getPublishedTestimonials,
  getActionsCached as getActions,
  getPublishedPressReleasesCached as getPublishedPressReleases,
} from "@/infrastructure/cache/content-cache";
