/** Lectures publiques site_settings (identité, réseaux, blocs CMS). */
export {
  getSiteConfigCached as getSiteConfig,
  getSocialLinksCached as getSocialLinks,
  getContentBlocksCached as getContentBlocks,
  getAboutTimeline,
  getLegalContent,
} from "@/infrastructure/cache/site-config-cache";

export { getPartnersCached as getPartners } from "@/infrastructure/cache/partners-cache";

export type {
  SiteConfig,
  SocialLinks,
  ContentBlocks,
  TimelineItem,
} from "@/domain/site-config";
