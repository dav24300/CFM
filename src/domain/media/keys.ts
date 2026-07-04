export const HERO_SETTING_KEYS = [
  "hero_image",
  "hero_image_mobile",
  "hero_poster",
  "hero_video",
  "hero_image_alt",
  "mission_image",
  "mission_image_alt",
] as const;

export type HeroSettingKey = (typeof HERO_SETTING_KEYS)[number];

export const DEFAULT_SETTING_KEYS = {
  news: "default_news_cover",
  live: "default_live_thumb",
  testimonial1: "default_testimonial_1",
  testimonial2: "default_testimonial_2",
  testimonialAnonymous: "default_testimonial_anonymous",
  pressKit: "press_kit_url",
  ogImage: "og_image",
  aboutFounder: "about_founder",
  aboutTeam: "about_team",
  favicon: "favicon_url",
} as const;

export const DEFAULT_SETTING_KEY_VALUES = [
  "default_news_cover",
  "default_live_thumb",
  "default_testimonial_1",
  "default_testimonial_2",
  "default_testimonial_anonymous",
  "press_kit_url",
  "og_image",
  "about_founder",
  "about_team",
  "favicon_url",
] as const;

/** Clés site_settings assignables via upload admin */
export const ASSIGNABLE_MEDIA_KEYS = [
  ...HERO_SETTING_KEYS,
  ...DEFAULT_SETTING_KEY_VALUES,
] as const;

export const AXIS_SLUGS = [
  "social",
  "economique",
  "education",
  "environnement",
  "sante",
] as const;

export type AxisSlug = (typeof AXIS_SLUGS)[number];

export function isAssignableMediaKey(key: string): key is (typeof ASSIGNABLE_MEDIA_KEYS)[number] {
  return (ASSIGNABLE_MEDIA_KEYS as readonly string[]).includes(key);
}
