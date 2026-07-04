import {
  getStore,
  updateStore,
  nextId,
} from "@/infrastructure/persistence/store-access";
import { slugify } from "@/infrastructure/persistence/store.impl";
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
import { invalidateContentCache } from "@/infrastructure/cache/invalidate";
import { compareIsoDesc, toDateString } from "@/infrastructure/persistence/normalize-pg-row";

export type { News, Study, Campaign, Testimonial, Action, PressRelease };

export function getPublishedNews(): News[] {
  return getStore()
    .news.filter((n) => n.published === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export function getPublishedStudies(): Study[] {
  return getStore()
    .studies.filter((s) => s.published === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export function getActiveCampaigns(): Campaign[] {
  return getStore()
    .campaigns.filter((c) => c.active === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export function getPublishedTestimonials(): Testimonial[] {
  return getStore()
    .testimonials.filter((t) => t.published === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export function getActions(): Action[] {
  return getStore().actions.sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return toDateString(b.date).localeCompare(toDateString(a.date));
  });
}

export function getPublishedPressReleases(): PressRelease[] {
  return getStore()
    .press_releases.filter((p) => p.published === 1)
    .sort((a, b) => compareIsoDesc(a.created_at, b.created_at));
}

export function addNewsletter(email: string): void {
  updateStore((store) => {
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

export function addMembership(data: {
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
}): void {
  updateStore((store) => {
    store.memberships.push({
      id: nextId(store),
      ...data,
      status: "pending",
      created_at: new Date().toISOString(),
    });
  });
}

export function addHelpRequest(data: Record<string, unknown>): void {
  updateStore((store) => {
    store.help_requests.push({
      id: nextId(store),
      ...data,
      status: "new",
      created_at: new Date().toISOString(),
    });
  });
}

export function getHelpRequestById(id: number): Record<string, unknown> | undefined {
  return getStore().help_requests.find((h) => h.id === id);
}

export function addContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: string;
}): void {
  updateStore((store) => {
    store.contact_messages.push({
      id: nextId(store),
      ...data,
      created_at: new Date().toISOString(),
    });
  });
}

export function getAdminStats() {
  const store = getStore();
  const pendingUsers = (store.users || []).filter((u) => u.status === "pending").length;
  const pendingFamily = (store.family_links || []).filter(
    (l) => l.status !== "approved" && l.status !== "rejected"
  ).length;
  const pendingChat = (store.live_chat_messages || []).filter((m) => m.status === "pending").length;
  return {
    news: store.news.length,
    studies: store.studies.length,
    campaigns: store.campaigns.length,
    memberships: store.memberships.length,
    help_requests: store.help_requests.length,
    newsletter: store.newsletter.length,
    contacts: store.contact_messages.length,
    pending_memberships: store.memberships.filter((m) => m.status === "pending").length,
    new_help: store.help_requests.filter((h) => h.status === "new").length,
    users: (store.users || []).length,
    pending_users: pendingUsers,
    donations: (store.donations || []).length,
    petitions: (store.petitions || []).length,
    family_links: (store.family_links || []).length,
    pending_family_links: pendingFamily,
    live_events: (store.live_events || []).length,
    pending_chat: pendingChat,
  };
}

export function getAdminData() {
  const store = getStore();
  return {
    memberships: [...store.memberships].reverse(),
    help_requests: [...store.help_requests].reverse().map((h) => decryptHelpRequest(h)),
    newsletter: [...store.newsletter].reverse(),
    contacts: [...store.contact_messages].reverse(),
    news: [...store.news].reverse(),
    studies: [...store.studies].reverse(),
    campaigns: [...store.campaigns].reverse(),
    actions: getActions(),
    testimonials: [...store.testimonials].reverse(),
    press_releases: [...store.press_releases].reverse(),
  };
}

export function adminCreate(table: string, data: Record<string, string>): void {
  updateStore((store) => {
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
        description: data.description || null,
        content: data.content || null,
        image_url: data.image_url || null,
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
  });
  invalidateContentCache(table);
}

export function adminUpdateStatus(table: string, id: number, status: string): void {
  updateStore((store) => {
    if (table === "memberships") {
      const item = store.memberships.find((m) => m.id === id);
      if (item) item.status = status;
    } else if (table === "help_requests") {
      const item = store.help_requests.find((h) => h.id === id);
      if (item) item.status = status;
    }
  });
}

export function adminUpdateContent(
  table: string,
  id: number,
  data: Record<string, string | number | null>
): boolean {
  const allowed = ["news", "studies", "campaigns", "actions", "testimonials", "press_releases"] as const;
  if (!allowed.includes(table as (typeof allowed)[number])) return false;

  let found = false;
  updateStore((store) => {
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

export function adminDelete(table: string, id: number): void {
  const allowed = ["news", "studies", "campaigns", "actions", "testimonials", "press_releases"] as const;
  if (!allowed.includes(table as (typeof allowed)[number])) return;

  updateStore((store) => {
    const key = table as keyof typeof store;
    if (Array.isArray(store[key])) {
      (store[key] as { id: number }[]) = (store[key] as { id: number }[]).filter(
        (item) => item.id !== id
      );
    }
  });
  invalidateContentCache(table);
}
