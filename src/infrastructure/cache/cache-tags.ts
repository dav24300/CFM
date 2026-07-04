/** Tags Next.js Data Cache — invalidation granulaire par agrégat. */
export const CACHE_TAGS = {
  content: "cfm:content",
  news: "cfm:news",
  studies: "cfm:studies",
  campaigns: "cfm:campaigns",
  testimonials: "cfm:testimonials",
  actions: "cfm:actions",
  press: "cfm:press",
  mediaSettings: "cfm:media-settings",
} as const;

export type ContentTable =
  | "news"
  | "studies"
  | "campaigns"
  | "actions"
  | "testimonials"
  | "press_releases";

const TABLE_TO_TAG: Record<ContentTable, string> = {
  news: CACHE_TAGS.news,
  studies: CACHE_TAGS.studies,
  campaigns: CACHE_TAGS.campaigns,
  actions: CACHE_TAGS.actions,
  testimonials: CACHE_TAGS.testimonials,
  press_releases: CACHE_TAGS.press,
};

export function tagForContentTable(table: string): string | null {
  return TABLE_TO_TAG[table as ContentTable] ?? null;
}
