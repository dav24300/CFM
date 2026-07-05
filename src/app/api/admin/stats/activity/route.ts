import { getStoreAsync } from "@/lib/store";
import { requireAdminAccess } from "@/lib/admin-rest";
import { jsonData } from "@/lib/api-response";

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(d.getDate() - i);
    days.push(x.toISOString().slice(0, 10));
  }
  return days;
}

export async function GET() {
  const auth = await requireAdminAccess();
  if (!auth.ok) return auth.response;

  const store = await getStoreAsync();
  const days = lastNDays(7);

  const countByDay = (items: { created_at: string }[]) => {
    const map = new Map<string, number>();
    for (const d of days) map.set(d, 0);
    for (const item of items) {
      const k = dayKey(item.created_at);
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
    }
    return days.map((date) => ({ date, count: map.get(date) || 0 }));
  };

  return jsonData({
    days: 7,
    series: {
      help: countByDay(store.help_requests as { created_at: string }[]),
      memberships: countByDay(store.memberships as { created_at: string }[]),
      donations: countByDay(store.donations as { created_at: string }[]),
      contacts: countByDay(
        store.contact_messages as { created_at: string }[]
      ),
      users: countByDay(store.users as { created_at: string }[]),
    },
  });
}
