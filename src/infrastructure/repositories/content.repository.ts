import {
  getStoreAsync,
  updateStoreAsync,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { slugify } from "@/infrastructure/persistence/store-seed";
import { withStoreMutation } from "@/infrastructure/persistence/admin-mutation";
import { invalidateContentCache } from "@/infrastructure/cache/invalidate";
import { domainError } from "@/domain/errors/domain-error";
import type {
  News,
  Study,
  Campaign,
  Testimonial,
  Action,
  PressRelease,
} from "@/domain/entities/content";
import { decryptHelpRequest } from "@/infrastructure/encryption/aes.adapter";
import { compareIsoDesc, toDateString } from "@/infrastructure/persistence/normalize-pg-row";
import type { Store } from "@/domain/entities/store";
import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sqlNewsletter from "@/infrastructure/repositories/sql/newsletter.sql";
import * as sqlForms from "@/infrastructure/repositories/sql/forms.sql";
import * as sqlContent from "@/infrastructure/repositories/sql/content.sql";
import { getPetitionAdminCounters } from "@/infrastructure/repositories/petitions.repository";
import { getUserAdminCounters } from "@/infrastructure/repositories/users.repository";
import { getFamilyLinkCounters } from "@/infrastructure/repositories/family-links.repository";
import { countDonations } from "@/infrastructure/repositories/donations.repository";
import { getLiveAdminCounters } from "@/infrastructure/repositories/live.repository";
import { getSiteSetting } from "@/infrastructure/repositories/settings.repository";

export type { News, Study, Campaign, Testimonial, Action, PressRelease };

export async function getPublishedNewsAsync(): Promise<News[]> {
  if (isPgMode()) return sqlContent.getPublishedNews();
  const store = await getStoreAsync();
  return store.news
    .filter((n) => n.published === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export async function getPublishedStudiesAsync(): Promise<Study[]> {
  if (isPgMode()) return sqlContent.getPublishedStudies();
  const store = await getStoreAsync();
  return store.studies
    .filter((s) => s.published === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export async function getActiveCampaignsAsync(): Promise<Campaign[]> {
  if (isPgMode()) return sqlContent.getActiveCampaigns();
  const store = await getStoreAsync();
  return store.campaigns
    .filter((c) => c.active === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export async function getPublishedTestimonialsAsync(): Promise<Testimonial[]> {
  if (isPgMode()) return sqlContent.getPublishedTestimonials();
  const store = await getStoreAsync();
  return store.testimonials
    .filter((t) => t.published === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export async function getActionsAsync(): Promise<Action[]> {
  if (isPgMode()) return sqlContent.getActionsSorted();
  const store = await getStoreAsync();
  return store.actions.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return toDateString(b.date).localeCompare(toDateString(a.date));
  });
}

export async function getPublishedPressReleasesAsync(): Promise<PressRelease[]> {
  if (isPgMode()) return sqlContent.getPublishedPressReleases();
  const store = await getStoreAsync();
  return store.press_releases
    .filter((p) => p.published === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

// ── Listes complètes (brouillons inclus), ordre id ASC ─────────────────────
// Utilisées par media.repository (détection d'usages / scan des visuels
// manquants) : parité avec l'itération directe du Store (ordre d'insertion).

export async function listAllNews(): Promise<News[]> {
  if (isPgMode()) return (await sqlContent.listNewsDesc()).reverse();
  const store = await getStoreAsync();
  return [...store.news];
}

export async function listAllStudies(): Promise<Study[]> {
  if (isPgMode()) return (await sqlContent.listStudiesDesc()).reverse();
  const store = await getStoreAsync();
  return [...store.studies];
}

export async function listAllCampaigns(): Promise<Campaign[]> {
  if (isPgMode()) return (await sqlContent.listCampaignsDesc()).reverse();
  const store = await getStoreAsync();
  return [...store.campaigns];
}

export async function listAllTestimonials(): Promise<Testimonial[]> {
  if (isPgMode()) return (await sqlContent.listTestimonialsDesc()).reverse();
  const store = await getStoreAsync();
  return [...store.testimonials];
}

export async function listAllPressReleases(): Promise<PressRelease[]> {
  if (isPgMode()) return (await sqlContent.listPressReleasesDesc()).reverse();
  const store = await getStoreAsync();
  return [...store.press_releases];
}

/** @deprecated Utiliser getPublishedNewsAsync */
export const getPublishedNews = getPublishedNewsAsync;
export const getPublishedStudies = getPublishedStudiesAsync;
export const getActiveCampaigns = getActiveCampaignsAsync;
export const getPublishedTestimonials = getPublishedTestimonialsAsync;
export const getActions = getActionsAsync;
export const getPublishedPressReleases = getPublishedPressReleasesAsync;

export async function addNewsletter(email: string): Promise<void> {
  if (isPgMode()) return sqlNewsletter.addSubscriber(email);
  await updateStoreAsync((store) => {
    const exists = store.newsletter.some(
      (n) => n.email.toLowerCase() === email.toLowerCase()
    );
    if (exists) throw domainError("ALREADY_EXISTS");
    store.newsletter.push({
      id: nextId(store),
      email: email.trim().toLowerCase(),
      created_at: new Date().toISOString(),
    });
  });
}

export async function deleteNewsletterSubscriber(id: number): Promise<boolean> {
  if (isPgMode()) return sqlNewsletter.deleteSubscriber(id);
  let found = false;
  await updateStoreAsync((store) => {
    const before = store.newsletter.length;
    store.newsletter = store.newsletter.filter((n) => n.id !== id);
    found = store.newsletter.length < before;
  });
  return found;
}

/** Abonnés newsletter, plus récents d'abord (id DESC). */
export async function listNewsletterSubscribers(): Promise<Store["newsletter"]> {
  if (isPgMode()) return sqlNewsletter.listSubscribersDesc();
  const store = await getStoreAsync();
  return [...store.newsletter].reverse();
}

async function countNewsletterSubscribers(): Promise<number> {
  if (isPgMode()) return sqlNewsletter.countSubscribers();
  const store = await getStoreAsync();
  return store.newsletter.length;
}

export async function addMembership(data: {
  type: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  province?: string;
  military_link?: string;
  parent_military_name?: string;
  skills?: string;
  message?: string;
}): Promise<void> {
  if (isPgMode()) return sqlForms.addMembership(data);
  await updateStoreAsync((store) => {
    store.memberships.push({
      id: nextId(store),
      ...data,
      status: "pending",
      created_at: new Date().toISOString(),
    });
  });
}

export async function addHelpRequest(data: Record<string, unknown>): Promise<void> {
  if (isPgMode()) return sqlForms.addHelpRequest(data);
  await updateStoreAsync((store) => {
    store.help_requests.push({
      id: nextId(store),
      ...data,
      status: "new",
      created_at: new Date().toISOString(),
    });
  });
}

/** Demandes d'aide brutes (non déchiffrées), sans tri (ordre d'insertion). */
export async function listHelpRequestsRaw(): Promise<Record<string, unknown>[]> {
  if (isPgMode()) return sqlForms.listHelpRequestsRaw();
  const store = await getStoreAsync();
  return store.help_requests ?? [];
}

/** Dates de création (created_at brutes) des formulaires reçus. */
export async function getFormsActivityDates(): Promise<{
  help: string[];
  memberships: string[];
  contacts: string[];
}> {
  if (isPgMode()) return sqlForms.getFormsActivityDates();
  const store = await getStoreAsync();
  return {
    help: store.help_requests.map((h) => h.created_at as string),
    memberships: store.memberships.map((m) => m.created_at as string),
    contacts: store.contact_messages.map((c) => c.created_at as string),
  };
}

export async function getHelpRequestById(
  id: number
): Promise<Record<string, unknown> | undefined> {
  if (isPgMode()) return sqlForms.getHelpRequestById(id);
  const store = await getStoreAsync();
  return store.help_requests.find((h) => h.id === id);
}

export async function addContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: string;
}): Promise<void> {
  if (isPgMode()) return sqlForms.addContactMessage(data);
  await updateStoreAsync((store) => {
    store.contact_messages.push({
      id: nextId(store),
      ...data,
      status: "new",
      created_at: new Date().toISOString(),
    });
  });
}

export async function updateContactStatus(
  id: number,
  status: "new" | "read" | "archived"
): Promise<boolean> {
  if (isPgMode()) return sqlForms.updateContactStatus(id, status);
  let found = false;
  await updateStoreAsync((store) => {
    const msg = store.contact_messages.find((m) => m.id === id);
    if (!msg) return;
    msg.status = status;
    found = true;
  });
  return found;
}

/** Compteurs formulaires (dual-mode) pour le tableau de bord admin. */
async function getFormsAdminCounters(): Promise<{
  memberships: number;
  help_requests: number;
  contacts: number;
  pending_memberships: number;
  new_help: number;
}> {
  if (isPgMode()) return sqlForms.getFormsAdminCounters();
  const store = await getStoreAsync();
  return {
    memberships: store.memberships.length,
    help_requests: store.help_requests.length,
    contacts: store.contact_messages.length,
    pending_memberships: store.memberships.filter((m) => m.status === "pending").length,
    new_help: store.help_requests.filter((h) => h.status === "new").length,
  };
}

/** Compteurs contenu (dual-mode) pour le tableau de bord admin. */
async function getContentAdminCounters(): Promise<{
  news: number;
  studies: number;
  campaigns: number;
}> {
  if (isPgMode()) return sqlContent.getContentAdminCounters();
  const store = await getStoreAsync();
  return {
    news: store.news.length,
    studies: store.studies.length,
    campaigns: store.campaigns.length,
  };
}

export async function getAdminStats() {
  // Seul `petitionCounters` dépend d'une valeur précédente : le reste des
  // groupes de compteurs est indépendant et était pourtant enchaîné en série
  // (latence = somme des allers-retours au lieu du plus lent d'entre eux).
  const seenAtRaw = (await getSiteSetting("petition_signatures_seen_at")) || "";
  const [
    contentCounters,
    petitionCounters,
    userCounters,
    familyCounters,
    liveCounters,
    donations,
    formCounters,
    newsletter,
  ] = await Promise.all([
    getContentAdminCounters(),
    getPetitionAdminCounters(seenAtRaw),
    getUserAdminCounters(),
    getFamilyLinkCounters(),
    getLiveAdminCounters(),
    countDonations(),
    getFormsAdminCounters(),
    countNewsletterSubscribers(),
  ]);
  return {
    news: contentCounters.news,
    studies: contentCounters.studies,
    campaigns: contentCounters.campaigns,
    memberships: formCounters.memberships,
    help_requests: formCounters.help_requests,
    newsletter,
    contacts: formCounters.contacts,
    pending_memberships: formCounters.pending_memberships,
    new_help: formCounters.new_help,
    users: userCounters.users,
    pending_users: userCounters.pendingUsers,
    donations,
    petitions: petitionCounters.petitions,
    petition_signatures: petitionCounters.signatures,
    new_petition_signatures: petitionCounters.newSignatures,
    family_links: familyCounters.total,
    pending_family_links: familyCounters.pending,
    live_events: liveCounters.liveEvents,
    pending_chat: liveCounters.pendingChat,
  };
}

export async function getAdminData() {
  if (isPgMode()) {
    // 10 lectures indépendantes : en série, la latence était la somme des 10
    // allers-retours vers la base.
    const [
      memberships,
      helpRequests,
      newsletter,
      contacts,
      news,
      studies,
      campaigns,
      actions,
      testimonials,
      pressReleases,
    ] = await Promise.all([
      sqlForms.listMembershipsDesc(),
      sqlForms.listHelpRequestsDesc(),
      listNewsletterSubscribers(),
      sqlForms.listContactMessagesDesc(),
      sqlContent.listNewsDesc(),
      sqlContent.listStudiesDesc(),
      sqlContent.listCampaignsDesc(),
      getActionsAsync(),
      sqlContent.listTestimonialsDesc(),
      sqlContent.listPressReleasesDesc(),
    ]);
    return {
      memberships,
      help_requests: helpRequests.map((h) => decryptHelpRequest(h)),
      newsletter,
      contacts,
      news,
      studies,
      campaigns,
      actions,
      testimonials,
      press_releases: pressReleases,
    };
  }
  const store = await getStoreAsync();
  return {
    memberships: [...store.memberships].reverse(),
    help_requests: [...store.help_requests].reverse().map((h) => decryptHelpRequest(h)),
    newsletter: await listNewsletterSubscribers(),
    contacts: [...store.contact_messages].reverse(),
    news: [...store.news].reverse(),
    studies: [...store.studies].reverse(),
    campaigns: [...store.campaigns].reverse(),
    actions: await getActionsAsync(),
    testimonials: [...store.testimonials].reverse(),
    press_releases: [...store.press_releases].reverse(),
  };
}

export async function adminCreate(
  table: string,
  data: Record<string, string>
): Promise<void> {
  if (isPgMode()) {
    // Table inconnue : insert no-op mais invalidation quand même (parité avec
    // withStoreMutation qui invalide inconditionnellement).
    await sqlContent.adminCreate(table, data);
    invalidateContentCache(table);
    return;
  }
  await withStoreMutation(
    (store) => {
      const now = new Date().toISOString();
      if (table === "news") {
        const slug = data.slug || slugify(data.title);
        store.news.push({
          id: nextId(store),
          title: data.title,
          slug,
          excerpt: data.excerpt || null,
          content: data.content,
          category: data.category || "actualite",
          cover_image: data.cover_image || null,
          cover_image_alt: data.cover_image_alt || null,
          published: 1,
          created_at: now,
        });
      } else if (table === "studies") {
        store.studies.push({
          id: nextId(store),
          title: data.title,
          slug: data.slug || slugify(data.title),
          summary: data.summary || null,
          content: data.content,
          file_url: data.file_url || null,
          published: 1,
          created_at: now,
        });
      } else if (table === "campaigns") {
        store.campaigns.push({
          id: nextId(store),
          title: data.title,
          slug: data.slug || slugify(data.title),
          description: data.description || data.content || null,
          content: data.content || null,
          image_url: data.image_url || null,
          petition_slug: data.petition_slug || null,
          active: 1,
          created_at: now,
        });
      } else if (table === "actions") {
        store.actions.push({
          id: nextId(store),
          province: data.province,
          title: data.title,
          description: data.description || null,
          date: data.date || null,
          type: data.type || "action",
          photo: data.photo || null,
        });
      } else if (table === "testimonials") {
        store.testimonials.push({
          id: nextId(store),
          author: data.author || null,
          role: data.role || null,
          content: data.content,
          photo: data.photo || null,
          photo_alt: data.photo_alt || null,
          anonymous: data.anonymous === "1" ? 1 : 0,
          published: 1,
          created_at: now,
        });
      } else if (table === "press_releases") {
        store.press_releases.push({
          id: nextId(store),
          title: data.title,
          slug: data.slug || slugify(data.title),
          content: data.content,
          file_url: data.file_url || null,
          published: 1,
          created_at: now,
        });
      }
    },
    { invalidate: "content", contentTable: table }
  );
}

/**
 * Applique un patch partiel sur une actualité (édition admin).
 * Retourne false si l'actualité est introuvable ; invalide le cache
 * contenu « news » uniquement en cas de succès.
 */
export async function updateNewsItem(
  id: number,
  patch: {
    title?: string;
    content?: string;
    slug?: string;
    excerpt?: string;
    category?: string;
    cover_image?: string;
    cover_image_alt?: string;
    published?: 0 | 1;
  }
): Promise<boolean> {
  if (isPgMode()) {
    const found = await sqlContent.updateNewsItem(id, patch);
    if (found) invalidateContentCache("news");
    return found;
  }
  let found = false;
  await updateStoreAsync((store) => {
    const item = store.news.find((n) => n.id === id);
    if (!item) return;
    found = true;
    if (patch.title !== undefined) item.title = patch.title;
    if (patch.content !== undefined) item.content = patch.content;
    if (patch.slug !== undefined) item.slug = patch.slug;
    if (patch.excerpt !== undefined) item.excerpt = patch.excerpt || null;
    if (patch.category !== undefined) item.category = patch.category || "actualite";
    if (patch.cover_image !== undefined) item.cover_image = patch.cover_image || null;
    if (patch.cover_image_alt !== undefined) item.cover_image_alt = patch.cover_image_alt || null;
    if (patch.published !== undefined) item.published = patch.published;
  });
  if (found) invalidateContentCache("news");
  return found;
}

export async function adminUpdateStatus(
  table: string,
  id: number,
  status: string
): Promise<void> {
  if (isPgMode()) return sqlForms.adminUpdateStatus(table, id, status);
  await updateStoreAsync((store) => {
    if (table === "memberships") {
      const item = store.memberships.find((m) => m.id === id);
      if (item) item.status = status;
    } else if (table === "help_requests") {
      const item = store.help_requests.find((h) => h.id === id);
      if (item) item.status = status;
    }
  });
}

export async function adminUpdateContent(
  table: string,
  id: number,
  data: Record<string, string | number | null>
): Promise<boolean> {
  const allowed = ["news", "studies", "campaigns", "actions", "testimonials", "press_releases"] as const;
  if (!allowed.includes(table as (typeof allowed)[number])) return false;

  if (isPgMode()) {
    const found = await sqlContent.adminUpdateContent(table, id, data);
    if (found) invalidateContentCache(table);
    return found;
  }

  let found = false;
  await updateStoreAsync((store) => {
    const key = table as keyof typeof store;
    if (!Array.isArray(store[key])) return;
    const items = store[key] as { id: number; [k: string]: unknown }[];
    const item = items.find((i) => i.id === id);
    if (!item) return;
    found = true;
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) (item as Record<string, unknown>)[k] = v;
    }
  });
  if (found) invalidateContentCache(table);
  return found;
}

export async function adminDelete(table: string, id: number): Promise<void> {
  const allowed = ["news", "studies", "campaigns", "actions", "testimonials", "press_releases"] as const;
  if (!allowed.includes(table as (typeof allowed)[number])) return;

  if (isPgMode()) {
    // id inconnu : delete no-op mais invalidation quand même (parité Store).
    await sqlContent.adminDelete(table, id);
    invalidateContentCache(table);
    return;
  }

  await withStoreMutation(
    (store) => {
      const key = table as keyof typeof store;
      if (Array.isArray(store[key])) {
        (store[key] as { id: number }[]) = (store[key] as { id: number }[]).filter(
          (item) => item.id !== id
        );
      }
    },
    { invalidate: "content", contentTable: table }
  );
}
