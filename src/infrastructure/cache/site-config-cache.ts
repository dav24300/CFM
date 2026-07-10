import "server-only";
import { unstable_cache } from "next/cache";
import { getStoreAsync } from "@/infrastructure/persistence/store-access";
import { SITE } from "@/lib/constants";
import { CACHE_TAGS } from "@/infrastructure/cache/cache-tags";
import type {
  SiteConfig,
  SocialLinks,
  ContentBlocks,
  TimelineItem,
  LocalizedTimeline,
} from "@/domain/site-config";

const REVALIDATE_SECONDS = Number(process.env.CFM_CONTENT_CACHE_TTL ?? 300);

async function loadSiteConfig(): Promise<SiteConfig> {
  const store = await getStoreAsync();
  const s = store.site_settings;
  return {
    name: s.site_name || SITE.name,
    sigle: s.site_sigle || SITE.sigle,
    tagline: s.site_tagline || SITE.tagline,
    quote: s.site_quote || SITE.quote,
    founder: s.site_founder || SITE.founder,
    founded: parseInt(s.site_founded || String(SITE.founded), 10) || SITE.founded,
    country: s.site_country || SITE.country,
    email: s.site_email || SITE.email,
    phone: s.site_phone || SITE.phone,
  };
}

async function loadSocialLinks(): Promise<SocialLinks> {
  const store = await getStoreAsync();
  const raw = store.site_settings.social_links;
  if (!raw) {
    return {
      facebook: "https://facebook.com/cfmasbl",
      twitter: "https://x.com/cfmasbl",
      youtube: "https://youtube.com/@cfmasbl",
      linkedin: "https://linkedin.com/company/cfmasbl",
    };
  }
  try {
    return JSON.parse(raw) as SocialLinks;
  } catch {
    return {};
  }
}

async function loadContentBlocks(): Promise<ContentBlocks> {
  const store = await getStoreAsync();
  const raw = store.site_settings.content_blocks;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ContentBlocks;
  } catch {
    return {};
  }
}

export const getSiteConfigCached = unstable_cache(loadSiteConfig, ["cfm-site-config"], {
  tags: [CACHE_TAGS.siteConfig],
  revalidate: REVALIDATE_SECONDS,
});

export const getSocialLinksCached = unstable_cache(loadSocialLinks, ["cfm-social-links"], {
  tags: [CACHE_TAGS.siteConfig],
  revalidate: REVALIDATE_SECONDS,
});

export const getContentBlocksCached = unstable_cache(loadContentBlocks, ["cfm-content-blocks"], {
  tags: [CACHE_TAGS.siteConfig],
  revalidate: REVALIDATE_SECONDS,
});

const DEFAULT_TIMELINE_FR: TimelineItem[] = [
  {
    date: "2018",
    title: "Fondation de CFM",
    description: `Création de l'ASBL par ${SITE.founder}, fils de militaires, avec la mission de défendre les droits des dépendants.`,
  },
  {
    date: "2020",
    title: "Premières actions terrain",
    description: "Lancement des programmes d'accompagnement social et économique dans plusieurs provinces.",
  },
  {
    date: "2025",
    title: "FIKIN — Rassemblement historique",
    description: "Grand rassemblement des familles militaires à la Foire Internationale de Kinshasa.",
  },
  {
    date: "2026",
    title: "Mobilisation numérique",
    description: "Live, PWA, notifications push et interface multilingue (FR, EN, LN, SW).",
  },
];

const DEFAULT_TIMELINE_EN: TimelineItem[] = [
  {
    date: "2018",
    title: "CFM founded",
    description: `The NGO was created by ${SITE.founder} to defend the rights of military dependents.`,
  },
  {
    date: "2020",
    title: "First field actions",
    description: "Launch of social and economic support programmes across several provinces.",
  },
  {
    date: "2025",
    title: "FIKIN — Historic gathering",
    description: "Major gathering of military families at the Kinshasa International Fair.",
  },
  {
    date: "2026",
    title: "Digital mobilisation",
    description: "Live events, PWA, push notifications and multilingual interface (FR, EN, LN, SW).",
  },
];

export async function getAboutTimeline(
  locale: "fr" | "en" | "ln" | "sw"
): Promise<TimelineItem[]> {
  const blocks = await getContentBlocksCached();
  const key = locale === "en" ? "en" : "fr";
  const timeline: LocalizedTimeline = blocks.about_timeline || {};
  const items = timeline[key];
  if (items && items.length > 0) return items;
  return key === "en" ? DEFAULT_TIMELINE_EN : DEFAULT_TIMELINE_FR;
}

export async function getLegalContent(
  page: "legal_privacy" | "legal_mentions",
  locale: "fr" | "en" | "ln" | "sw"
): Promise<string | null> {
  const blocks = await getContentBlocksCached();
  const key = locale === "en" ? "en" : "fr";
  const block = blocks[page];
  if (!block) return null;
  return block[key] || block.fr || null;
}
