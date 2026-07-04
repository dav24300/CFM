export type GalleryItem = { src: string; alt: string; sort: number };

export type MediaCatalogEntry = {
  path: string;
  alt?: string;
  tags?: string[];
  category?: string;
  uploaded_at?: string;
};

export type MissingMediaItem = {
  type: string;
  id: number;
  title: string;
  field: string;
};

export type MediaHeroState = {
  hero_image: string;
  hero_image_mobile: string;
  hero_poster: string;
  hero_video: string;
  hero_image_alt: string;
  mission_image: string;
  mission_image_alt: string;
};

export type MediaDefaultsState = {
  default_news_cover: string;
  default_live_thumb: string;
  default_testimonial_1: string;
  default_testimonial_2: string;
  default_testimonial_anonymous: string;
  press_kit_url: string;
  og_image: string;
  about_founder: string;
  about_team: string;
  favicon_url: string;
};

export type FullMediaState = {
  hero: MediaHeroState;
  defaults: MediaDefaultsState;
  fikin_gallery: string;
  axis_images: string;
  media_catalog: string;
  hero_defaults: Record<string, string>;
};

export type MediaAssignTarget =
  | "news"
  | "studies"
  | "campaigns"
  | "press_releases"
  | "testimonials"
  | "live_events"
  | "partners";
