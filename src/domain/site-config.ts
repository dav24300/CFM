export type SiteConfig = {
  name: string;
  sigle: string;
  tagline: string;
  quote: string;
  founder: string;
  founded: number;
  country: string;
  email: string;
  phone: string;
};

export type SocialLinks = {
  facebook?: string;
  twitter?: string;
  youtube?: string;
  linkedin?: string;
};

export type TimelineItem = {
  date: string;
  title: string;
  description: string;
  image?: string;
};

export type LocalizedTimeline = {
  fr?: TimelineItem[];
  en?: TimelineItem[];
};

export type LocalizedMarkdown = {
  fr?: string;
  en?: string;
};

export type ContentBlocks = {
  about_timeline?: LocalizedTimeline;
  legal_privacy?: LocalizedMarkdown;
  legal_mentions?: LocalizedMarkdown;
};

export const SITE_SETTING_KEYS = [
  "site_name",
  "site_sigle",
  "site_tagline",
  "site_quote",
  "site_founder",
  "site_founded",
  "site_country",
  "site_email",
  "site_phone",
  "axes_hero_image",
  "content_blocks",
] as const;
