import { getFormsActivityDates } from "@/infrastructure/repositories/content.repository";
import { listUserCreationDates } from "@/infrastructure/repositories/users.repository";
import { listDonationCreationDates } from "@/infrastructure/repositories/donations.repository";
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

  const forms = await getFormsActivityDates();
  const users = await listUserCreationDates();
  const donations = await listDonationCreationDates();
  const days = lastNDays(7);

  const countByDay = (dates: string[]) => {
    const map = new Map<string, number>();
    for (const d of days) map.set(d, 0);
    for (const created_at of dates) {
      const k = dayKey(created_at);
      if (map.has(k)) map.set(k, (map.get(k) || 0) + 1);
    }
    return days.map((date) => ({ date, count: map.get(date) || 0 }));
  };

  return jsonData({
    days: 7,
    series: {
      help: countByDay(forms.help),
      memberships: countByDay(forms.memberships),
      donations: countByDay(donations),
      contacts: countByDay(forms.contacts),
      users: countByDay(users),
    },
  });
}
