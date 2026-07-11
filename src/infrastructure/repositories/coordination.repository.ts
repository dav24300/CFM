import { countFamilyUsers } from "@/infrastructure/repositories/users.repository";
import { listHelpRequestsRaw } from "@/infrastructure/repositories/content.repository";
import { listPortalEvents } from "@/infrastructure/repositories/events.repository";

export type CoordinationRequestSummary = {
  id: number;
  need_type: string;
  description: string;
  province: string;
  status: string;
  created_at: string;
};

export type CoordinationStats = {
  province: string | null;
  familiesFollowed: number;
  requestsToTreat: number;
  upcomingEvents: number;
  recentRequests: CoordinationRequestSummary[];
};

/**
 * Agrège les indicateurs de coordination provinciale via les repositories
 * propriétaires de chaque agrégat. Lecture seule et défensive.
 */
export async function getCoordinationStats(
  province?: string
): Promise<CoordinationStats> {
  const filterProvince = province && province.trim() ? province.trim() : null;

  const familiesFollowed = await countFamilyUsers(filterProvince);
  const helpRequests = await listHelpRequestsRaw();
  const events = await listPortalEvents();

  const provinceRequests = helpRequests.filter((h) => {
    if (filterProvince && String(h.province ?? "") !== filterProvince) return false;
    return true;
  });

  const openRequests = provinceRequests.filter((h) => {
    const status = String(h.status ?? "new");
    return status === "new" || status === "in_progress";
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcomingEvents = events.filter((e) => {
    if (!e.date || e.date < today) return false;
    if (filterProvince && e.province !== filterProvince) return false;
    return true;
  }).length;

  const recentRequests: CoordinationRequestSummary[] = [...provinceRequests]
    .sort((a, b) =>
      String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
    )
    .slice(0, 5)
    .map((h) => ({
      id: Number(h.id ?? 0),
      need_type: String(h.need_type ?? "aide"),
      description: String(h.description ?? ""),
      province: String(h.province ?? ""),
      status: String(h.status ?? "new"),
      created_at: String(h.created_at ?? ""),
    }));

  return {
    province: filterProvince,
    familiesFollowed,
    requestsToTreat: openRequests.length,
    upcomingEvents,
    recentRequests,
  };
}
