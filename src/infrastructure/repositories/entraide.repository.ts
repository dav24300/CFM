import {
  getStoreAsync,
  updateStoreAsync,
} from "@/infrastructure/persistence/store-access";
import { decryptSensitive } from "@/infrastructure/encryption/aes.adapter";

/**
 * Mission bénévole exposée dans la liste publique des missions à pourvoir.
 * NE contient PAS la description libre (confidentielle : situation, santé,
 * juridique) : elle n'est révélée qu'au bénévole APRÈS attribution.
 */
export type OpenHelpMission = {
  id: number;
  need_type: string | null;
  province: string | null;
  created_at: string | null;
};

/** Demande d'aide réclamée par un bénévole (description déchiffrée pour l'assigné). */
export type ClaimedHelpMission = OpenHelpMission & {
  description: string | null;
  status: string | null;
  assigned_volunteer_name: string | null;
};

const OPEN_STATUSES = new Set(["new", "in_progress"]);

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function hasAssignedVolunteer(entry: Record<string, unknown>): boolean {
  const raw = entry.assigned_volunteer_id;
  return raw !== undefined && raw !== null && raw !== "";
}

/**
 * Missions bénévoles à pourvoir : demandes d'aide dont le statut est ouvert
 * ({@link OPEN_STATUSES}) et qui n'ont pas encore de bénévole assigné.
 */
export async function getOpenHelpRequests(): Promise<OpenHelpMission[]> {
  const store = await getStoreAsync();
  const requests = store.help_requests ?? [];
  return requests
    .filter((entry) => {
      const status = asString(entry.status) ?? "";
      return OPEN_STATUSES.has(status) && !hasAssignedVolunteer(entry);
    })
    .map((entry) => ({
      id: asId(entry.id) ?? 0,
      need_type: asString(entry.need_type),
      province: asString(entry.province),
      created_at: asString(entry.created_at),
    }));
}

/**
 * Assigne une demande d'aide à un bénévole : pose
 * assigned_volunteer_id / assigned_volunteer_name et passe le statut à
 * "in_progress". Retourne true si l'entrée a été trouvée et mise à jour.
 */
export async function claimHelpRequest(
  id: number,
  volunteerId: number,
  volunteerName: string
): Promise<boolean> {
  let updated = false;
  await updateStoreAsync((store) => {
    if (!store.help_requests) store.help_requests = [];
    const entry = store.help_requests.find((h) => asId(h.id) === id);
    if (!entry) return;
    // Anti-vol de mission : ne pas ré-assigner une demande déjà prise en charge.
    if (hasAssignedVolunteer(entry)) return;
    entry.assigned_volunteer_id = volunteerId;
    entry.assigned_volunteer_name = volunteerName;
    entry.status = "in_progress";
    updated = true;
  });
  return updated;
}

/** Missions déjà réclamées par un bénévole donné. */
export async function getClaimedByUser(
  userId: number
): Promise<ClaimedHelpMission[]> {
  const store = await getStoreAsync();
  const requests = store.help_requests ?? [];
  return requests
    .filter((entry) => asId(entry.assigned_volunteer_id) === userId)
    .map((entry) => {
      const raw = asString(entry.description);
      return {
        id: asId(entry.id) ?? 0,
        need_type: asString(entry.need_type),
        // Déchiffré : seul le bénévole assigné voit la description en clair.
        description: raw ? decryptSensitive(raw) : null,
        province: asString(entry.province),
        created_at: asString(entry.created_at),
        status: asString(entry.status),
        assigned_volunteer_name: asString(entry.assigned_volunteer_name),
      };
    });
}
