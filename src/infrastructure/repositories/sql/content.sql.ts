import "server-only";
import type {
  News,
  Study,
  Campaign,
  Testimonial,
  Action,
  PressRelease,
  Partner,
} from "@/domain/entities/content";
import { normalizePgRow, normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";
import { slugify } from "@/infrastructure/persistence/store-seed";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query, withTransaction } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat « contenu » en SQL ciblé (mode PG) :
 * news, studies, campaigns, actions, testimonials, press_releases, partners.
 * Mêmes signatures et mêmes comportements que les branches Store de
 * content.repository / partners.repository. Les invalidations de cache restent
 * chez les appelants (repositories), comme dans la branche Store.
 *
 * Écart assumé vs Store : idx_news_slug / idx_studies_slug (index uniques SQL)
 * rejettent un slug dupliqué (23505 → PERSISTENCE_ERROR via mapPgError) là où
 * la branche Store insérait silencieusement le doublon. Choix le moins
 * disruptif sans toucher pg-errors : les handlers admin (createContentItem)
 * convertissent déjà toute erreur en « Erreur serveur » 500.
 */

type Row = Record<string, unknown>;

/**
 * Registre {table → colonnes patchables} des tables de contenu (hors id).
 * Sert de whitelist : adminUpdateContent ignore les clés hors schéma (la
 * branche Store les stockait dans l'objet JSON — sans colonne SQL, elles sont
 * abandonnées ; aucun appelant n'envoie de clé hors schéma, zod en amont).
 */
const CONTENT_COLUMNS: Record<string, readonly string[]> = {
  news: ["title", "slug", "excerpt", "content", "category", "cover_image", "cover_image_alt", "published", "created_at"],
  studies: ["title", "slug", "summary", "content", "file_url", "published", "created_at"],
  campaigns: ["title", "slug", "description", "content", "image_url", "petition_slug", "active", "created_at"],
  actions: ["province", "title", "description", "date", "type", "photo"],
  testimonials: ["author", "role", "content", "photo", "photo_alt", "anonymous", "published", "created_at"],
  press_releases: ["title", "slug", "content", "file_url", "published", "created_at"],
};

/** Constructeurs de ligne : défauts EXACTEMENT identiques à la branche Store. */
const CREATE_ROW_BUILDERS: Record<string, (data: Record<string, string>, now: string) => Row> = {
  news: (d, now) => ({
    title: d.title,
    slug: d.slug || slugify(d.title),
    excerpt: d.excerpt || null,
    content: d.content,
    category: d.category || "actualite",
    cover_image: d.cover_image || null,
    cover_image_alt: d.cover_image_alt || null,
    published: 1,
    created_at: now,
  }),
  studies: (d, now) => ({
    title: d.title,
    slug: d.slug || slugify(d.title),
    summary: d.summary || null,
    content: d.content,
    file_url: d.file_url || null,
    published: 1,
    created_at: now,
  }),
  campaigns: (d, now) => ({
    title: d.title,
    slug: d.slug || slugify(d.title),
    description: d.description || d.content || null,
    content: d.content || null,
    image_url: d.image_url || null,
    petition_slug: d.petition_slug || null,
    active: 1,
    created_at: now,
  }),
  actions: (d) => ({
    province: d.province,
    title: d.title,
    description: d.description || null,
    date: d.date || null,
    type: d.type || "action",
    photo: d.photo || null,
  }),
  testimonials: (d, now) => ({
    author: d.author || null,
    role: d.role || null,
    content: d.content,
    photo: d.photo || null,
    photo_alt: d.photo_alt || null,
    anonymous: d.anonymous === "1" ? 1 : 0,
    published: 1,
    created_at: now,
  }),
  press_releases: (d, now) => ({
    title: d.title,
    slug: d.slug || slugify(d.title),
    content: d.content,
    file_url: d.file_url || null,
    published: 1,
    created_at: now,
  }),
};

// ── Lecteurs publics ────────────────────────────────────────────────────────
// Tri created_at DESC + tie-break id ASC pour la stabilité (comme C10/C11) —
// équivalent du sort stable compareIsoDesc sur l'ordre d'insertion du Store.

export async function getPublishedNews(): Promise<News[]> {
  try {
    const res = await query<News>(
      "SELECT * FROM news WHERE published = 1 ORDER BY created_at DESC, id ASC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPublishedStudies(): Promise<Study[]> {
  try {
    const res = await query<Study>(
      "SELECT * FROM studies WHERE published = 1 ORDER BY created_at DESC, id ASC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  try {
    const res = await query<Campaign>(
      "SELECT * FROM campaigns WHERE active = 1 ORDER BY created_at DESC, id ASC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPublishedTestimonials(): Promise<Testimonial[]> {
  try {
    const res = await query<Testimonial>(
      "SELECT * FROM testimonials WHERE published = 1 ORDER BY created_at DESC, id ASC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

/** Actions triées date DESC, dates nulles en dernier (parité getActionsAsync). */
export async function getActionsSorted(): Promise<Action[]> {
  try {
    const res = await query<Action>(
      `SELECT * FROM actions ORDER BY "date" DESC NULLS LAST, id ASC`
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function getPublishedPressReleases(): Promise<PressRelease[]> {
  try {
    const res = await query<PressRelease>(
      "SELECT * FROM press_releases WHERE published = 1 ORDER BY created_at DESC, id ASC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

// ── Listes admin (id DESC — équivalent du [...store.xxx].reverse()) ─────────

async function listTableDesc<T extends Row>(table: string): Promise<T[]> {
  try {
    const res = await query<T>(`SELECT * FROM "${table}" ORDER BY id DESC`);
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export const listNewsDesc = () => listTableDesc<News>("news");
export const listStudiesDesc = () => listTableDesc<Study>("studies");
export const listCampaignsDesc = () => listTableDesc<Campaign>("campaigns");
export const listTestimonialsDesc = () => listTableDesc<Testimonial>("testimonials");
export const listPressReleasesDesc = () => listTableDesc<PressRelease>("press_releases");

/** Compteurs contenu pour le tableau de bord admin. */
export async function getContentAdminCounters(): Promise<{
  news: number;
  studies: number;
  campaigns: number;
}> {
  try {
    const [news, studies, campaigns] = await Promise.all([
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM news"),
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM studies"),
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM campaigns"),
    ]);
    return { news: news.rows[0].n, studies: studies.rows[0].n, campaigns: campaigns.rows[0].n };
  } catch (err) {
    mapPgError(err);
  }
}

// ── CRUD admin générique (par nom de table, registre = whitelist) ───────────

/** Création générique — table inconnue : no-op silencieux (parité Store). */
export async function adminCreate(
  table: string,
  data: Record<string, string>
): Promise<void> {
  const build = CREATE_ROW_BUILDERS[table];
  if (!build) return;
  const row = build(data, new Date().toISOString());
  const cols = Object.keys(row);
  try {
    await query(
      `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")})
       VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})`,
      cols.map((c) => row[c])
    );
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Patch générique. Retourne true si la ligne existe (même pour un patch vide
 * ou intégralement filtré — parité avec le « found » de la branche Store).
 */
export async function adminUpdateContent(
  table: string,
  id: number,
  data: Record<string, string | number | null>
): Promise<boolean> {
  const allowed = CONTENT_COLUMNS[table];
  if (!allowed) return false;
  const entries = Object.entries(data).filter(
    ([k, v]) => v !== undefined && allowed.includes(k)
  );
  try {
    if (entries.length === 0) {
      const res = await query(`SELECT 1 FROM "${table}" WHERE id = $1`, [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const sets = entries.map(([k], i) => `"${k}" = $${i + 2}`).join(", ");
    const res = await query(`UPDATE "${table}" SET ${sets} WHERE id = $1`, [
      id,
      ...entries.map(([, v]) => v),
    ]);
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    mapPgError(err);
  }
}

/** Suppression générique — id inconnu : no-op silencieux (parité Store). */
export async function adminDelete(table: string, id: number): Promise<void> {
  if (!CONTENT_COLUMNS[table]) return;
  try {
    await query(`DELETE FROM "${table}" WHERE id = $1`, [id]);
  } catch (err) {
    mapPgError(err);
  }
}

/** Patch partiel d'une actualité — normalisation identique à la branche Store. */
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
  const norm: Row = {};
  if (patch.title !== undefined) norm.title = patch.title;
  if (patch.content !== undefined) norm.content = patch.content;
  if (patch.slug !== undefined) norm.slug = patch.slug;
  if (patch.excerpt !== undefined) norm.excerpt = patch.excerpt || null;
  if (patch.category !== undefined) norm.category = patch.category || "actualite";
  if (patch.cover_image !== undefined) norm.cover_image = patch.cover_image || null;
  if (patch.cover_image_alt !== undefined)
    norm.cover_image_alt = patch.cover_image_alt || null;
  if (patch.published !== undefined) norm.published = patch.published;

  const cols = Object.keys(norm);
  try {
    if (cols.length === 0) {
      const res = await query("SELECT 1 FROM news WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const sets = cols.map((k, i) => `"${k}" = $${i + 2}`).join(", ");
    const res = await query(`UPDATE news SET ${sets} WHERE id = $1`, [
      id,
      ...cols.map((k) => norm[k]),
    ]);
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    mapPgError(err);
  }
}

// ── Partenaires ─────────────────────────────────────────────────────────────

/** sort_order ASC + tie-break id ASC — équivalent du sort stable Store. */
export async function getAllPartnersSorted(): Promise<Partner[]> {
  try {
    const res = await query<Partner>(
      "SELECT * FROM partners ORDER BY sort_order ASC, id ASC"
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

export async function createPartner(data: {
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
  sort_order?: number;
}): Promise<Partner> {
  return withTransaction(async (client) => {
    // sort_order par défaut = COUNT(*) + 1 (parité store.partners.length + 1) ;
    // ?? Store conservé : 0 explicite reste 0.
    let sortOrder = data.sort_order;
    if (sortOrder === undefined || sortOrder === null) {
      const count = await client.query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM partners"
      );
      sortOrder = count.rows[0].n + 1;
    }
    const res = await client.query<Partner>(
      `INSERT INTO partners (name, logo_url, website, description, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.name,
        data.logo_url || null,
        data.website || null,
        data.description || null,
        sortOrder,
      ]
    );
    return normalizePgRow(res.rows[0]);
  }).catch((err) => mapPgError(err));
}

const PARTNER_COLUMNS = ["name", "logo_url", "website", "description", "sort_order"] as const;

/** Patch partiel — patch vide : found = existence de la ligne (parité Store). */
export async function updatePartner(
  id: number,
  data: Partial<Omit<Partner, "id">>
): Promise<boolean> {
  const fields = PARTNER_COLUMNS.filter((k) => data[k] !== undefined);
  try {
    if (fields.length === 0) {
      const res = await query("SELECT 1 FROM partners WHERE id = $1", [id]);
      return (res.rowCount ?? 0) > 0;
    }
    const sets = fields.map((k, i) => `"${k}" = $${i + 2}`).join(", ");
    const res = await query(`UPDATE partners SET ${sets} WHERE id = $1`, [
      id,
      ...fields.map((k) => data[k] as unknown),
    ]);
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    mapPgError(err);
  }
}

/** id inconnu : no-op silencieux (parité Store). */
export async function deletePartner(id: number): Promise<void> {
  try {
    await query("DELETE FROM partners WHERE id = $1", [id]);
  } catch (err) {
    mapPgError(err);
  }
}
