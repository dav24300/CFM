export type News = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  cover_image?: string | null;
  cover_image_alt?: string | null;
  published: number;
  created_at: string;
};

export type Study = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  file_url: string | null;
  published: number;
  created_at: string;
};

export type Campaign = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  image_url: string | null;
  petition_slug?: string | null;
  active: number;
  created_at: string;
};

export type Partner = {
  id: number;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string | null;
  sort_order: number;
};

export type Testimonial = {
  id: number;
  author: string | null;
  role: string | null;
  content: string;
  photo?: string | null;
  photo_alt?: string | null;
  anonymous: number;
  published: number;
  created_at: string;
};

export type Action = {
  id: number;
  province: string;
  title: string;
  description: string | null;
  date: string | null;
  type: string;
  photo?: string | null;
};

export type PressRelease = {
  id: number;
  title: string;
  slug: string;
  content: string;
  file_url: string | null;
  published: number;
  created_at: string;
};
