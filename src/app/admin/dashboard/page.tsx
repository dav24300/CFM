import { redirect } from "next/navigation";
import { getAdminAccess } from "@/lib/admin-access";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminDashboardPage() {
  const access = await getAdminAccess();
  if (!access) redirect("/admin");

  return <AdminDashboard access={access} />;
}
