"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/ui/primitives/spinner";
import { AdminToastProvider } from "@/components/admin/context/AdminToastContext";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { AdminOverview } from "@/components/admin/overview/AdminOverview";
import { InboxPanel } from "@/components/admin/inbox/InboxPanel";
import { ContentPanel } from "@/components/admin/content/ContentPanel";
import { TerritoryPanel } from "@/components/admin/territory/TerritoryPanel";
import { CommunityPanel } from "@/components/admin/community/CommunityPanel";
import { DonationsPanel } from "@/components/admin/donations/DonationsPanel";
import { AdminV3Panel } from "@/components/admin/AdminV3Panel";
import { AdminDesignPanel } from "@/components/admin/AdminDesignPanel";
import { I18nPanel } from "@/components/admin/i18n/I18nPanel";
import { IdentityPanel } from "@/components/admin/identity/IdentityPanel";
import { PagesPanel } from "@/components/admin/pages/PagesPanel";
import { PartnersPanel } from "@/components/admin/partners/PartnersPanel";
import { AuditPanel } from "@/components/admin/audit/AuditPanel";
import { loadAdminBundle } from "@/components/admin/hooks/useAdminApi";
import type { AdminAccess, AdminSection, AdminStats, AdminData } from "@/components/admin/types";

type Props = { access: AdminAccess };

function DashboardBody({
  access,
  section,
  stats,
  data,
  liveEvents,
  onReload,
}: {
  access: AdminAccess;
  section: AdminSection;
  stats: AdminStats;
  data: AdminData;
  liveEvents: Record<string, unknown>[];
  onReload: () => void;
}) {
  switch (section) {
    case "overview":
      return <AdminOverview stats={stats} />;
    case "inbox":
      return <InboxPanel data={data} onReload={onReload} />;
    case "content":
      return <ContentPanel data={data} onReload={onReload} />;
    case "territory":
      return <TerritoryPanel data={data} onReload={onReload} />;
    case "community":
      return <CommunityPanel data={data} onReload={onReload} />;
    case "donations":
      return <DonationsPanel data={data} onReload={onReload} />;
    case "live":
      return (
        <AdminV3Panel
          initialEvents={liveEvents as Parameters<typeof AdminV3Panel>[0]["initialEvents"]}
          onReload={onReload}
        />
      );
    case "design":
      return <AdminDesignPanel />;
    case "identity":
      return <IdentityPanel />;
    case "pages":
      return <PagesPanel />;
    case "i18n":
      return <I18nPanel />;
    case "partners":
      return <PartnersPanel />;
    case "audit":
      return <AuditPanel />;
    default:
      return null;
  }
}

export function AdminDashboard({ access }: Props) {
  const router = useRouter();
  const [section, setSection] = useState<AdminSection>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [liveEvents, setLiveEvents] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const bundle = await loadAdminBundle();
      if (!bundle) {
        window.location.href = "/admin";
        return;
      }
      setStats(bundle.stats);
      setData(bundle.data);
      setLiveEvents(bundle.liveEvents);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  return (
    <AdminToastProvider>
      <div className="flex min-h-screen bg-admin-bg">
        <AdminSidebar
          active={section}
          onChange={setSection}
          stats={stats}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader
            access={access}
            stats={stats}
            onRefresh={load}
            loading={loading}
            onLogout={logout}
            onMenuToggle={() => setSidebarOpen((v) => !v)}
          />
          <main className="flex-1 overflow-auto p-6">
            {loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                <p className="text-sm text-red-800">
                  Impossible de charger le tableau de bord. Vérifiez la connexion au serveur puis réessayez.
                </p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-4 text-sm font-semibold text-admin-ink underline"
                >
                  Réessayer
                </button>
              </div>
            ) : loading && !data ? (
              <div className="flex justify-center py-20">
                <Spinner className="h-8 w-8" />
              </div>
            ) : data && stats ? (
              <DashboardBody
                access={access}
                section={section}
                stats={stats}
                data={data}
                liveEvents={liveEvents}
                onReload={load}
              />
            ) : null}
          </main>
        </div>
      </div>
    </AdminToastProvider>
  );
}
