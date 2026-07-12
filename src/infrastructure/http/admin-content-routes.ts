import { NextRequest } from "next/server";
import { requireAdminAccess, requireAdminRole } from "@/lib/admin-rest";
import { parseOrBadRequest, z } from "@/lib/validators";
import { getAdminData } from "@/infrastructure/repositories/content.repository";
import { jsonData, jsonNotFound, jsonSuccess } from "@/infrastructure/http/api-response";
import {
  applyZodPatch,
  createContentItem,
  deleteContentItem,
  getContentItem,
  parseContentId,
  patchContentItem,
  type ContentTable,
} from "@/infrastructure/http/admin-content-handlers";

/**
 * Factories des routes CRUD admin de contenu (P2.4).
 *
 * Iso-comportement STRICT par table : mêmes codes HTTP, mêmes payloads,
 * mêmes niveaux d'accès PAR ROUTE que les fichiers historiques.
 * Les divergences existantes (news : 404 au lieu de {item:null},
 * messages "Actualité introuvable", persistance via updateNewsItem ;
 * testimonials : normalisation `anonymous`) sont préservées via les options.
 */

/** Garde d'accès par route : requireAdminRole ou requireAdminAccess. */
export type AdminGuard = typeof requireAdminRole | typeof requireAdminAccess;

type ContentPatch = Record<string, string | number | null>;
type ItemParams = { params: Promise<{ id: string }> };

type CollectionRouteOptions<T extends Record<string, unknown>> = {
  guard: AdminGuard;
  createSchema: z.ZodType<T>;
  /** Prépare les données avant insertion (ex. testimonials : anonymous → string). */
  transformCreate?: (data: T) => Record<string, string>;
};

/**
 * Routes collection (GET liste + POST création).
 * La clé de la réponse GET est le nom de table (ex. { studies: [...] }),
 * identique aux routes historiques pour les 5 tables.
 */
export function createContentCollectionRoutes<T extends Record<string, unknown>>(
  table: ContentTable,
  options: CollectionRouteOptions<T>
) {
  const { guard, createSchema, transformCreate } = options;

  async function GET() {
    const auth = await guard();
    if (!auth.ok) return auth.response;
    const data = await getAdminData();
    return jsonData({ [table]: data[table as keyof typeof data] });
  }

  async function POST(request: NextRequest) {
    const auth = await guard();
    if (!auth.ok) return auth.response;
    const parsed = parseOrBadRequest(createSchema, await request.json());
    if (!parsed.ok) return parsed.response;
    const data = transformCreate
      ? transformCreate(parsed.data)
      : (parsed.data as Record<string, string>);
    return createContentItem(table, data);
  }

  return { GET, POST };
}

type ItemRouteOptions<T extends Record<string, unknown>> = {
  guard: AdminGuard;
  patchSchema: z.ZodType<T>;
  /** Ajuste le patch standard avant persistance (ex. testimonials : anonymous → 0|1). */
  transformPatch?: (patch: ContentPatch) => ContentPatch;
  /** Message des 404 quand l'id n'est pas numérique (défaut : "ID invalide"). */
  invalidIdMessage?: string;
  /**
   * Si défini, GET répond 404 avec ce message quand l'élément est absent
   * (comportement historique de news) au lieu de 200 { item: null }.
   */
  getNotFoundMessage?: string;
  /**
   * Persistance PATCH spécifique (news : updateNewsItem).
   * Retourne false si l'élément est introuvable → 404 patchNotFoundMessage.
   */
  applyPatch?: (id: number, data: T) => Promise<boolean>;
  /** Message 404 quand applyPatch ne trouve pas l'élément. */
  patchNotFoundMessage?: string;
};

/** Routes détail (GET / PATCH / DELETE sur [id]). */
export function createContentItemRoutes<T extends Record<string, unknown>>(
  table: ContentTable,
  options: ItemRouteOptions<T>
) {
  const {
    guard,
    patchSchema,
    transformPatch,
    invalidIdMessage = "ID invalide",
    getNotFoundMessage,
    applyPatch,
    patchNotFoundMessage = "Élément introuvable",
  } = options;

  async function GET(_request: NextRequest, { params }: ItemParams) {
    const auth = await guard();
    if (!auth.ok) return auth.response;
    const id = parseContentId((await params).id);
    const item = id !== null ? await getContentItem(table, id) : null;
    if (!item && getNotFoundMessage) return jsonNotFound(getNotFoundMessage);
    return jsonData({ item });
  }

  async function PATCH(request: NextRequest, { params }: ItemParams) {
    const auth = await guard();
    if (!auth.ok) return auth.response;
    const parsed = parseOrBadRequest(patchSchema, await request.json());
    if (!parsed.ok) return parsed.response;
    const id = parseContentId((await params).id);
    if (id === null) return jsonNotFound(invalidIdMessage);
    if (applyPatch) {
      const found = await applyPatch(id, parsed.data);
      if (!found) return jsonNotFound(patchNotFoundMessage);
      return jsonSuccess();
    }
    const patch = applyZodPatch(parsed.data);
    return patchContentItem(table, id, transformPatch ? transformPatch(patch) : patch);
  }

  async function DELETE(_request: NextRequest, { params }: ItemParams) {
    const auth = await guard();
    if (!auth.ok) return auth.response;
    const id = parseContentId((await params).id);
    if (id === null) return jsonNotFound(invalidIdMessage);
    return deleteContentItem(table, id);
  }

  return { GET, PATCH, DELETE };
}
