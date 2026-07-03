export {
  getPublishedNewsCached as getPublishedNews,
  getPublishedStudiesCached as getPublishedStudies,
  getActiveCampaignsCached as getActiveCampaigns,
  getPublishedTestimonialsCached as getPublishedTestimonials,
  getActionsCached as getActions,
  getPublishedPressReleasesCached as getPublishedPressReleases,
} from "@/infrastructure/cache/content-cache";

export type {
  News,
  Study,
  Campaign,
  Testimonial,
  Action,
  PressRelease,
} from "@/infrastructure/repositories/content.repository";
