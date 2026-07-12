"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/primitives/spinner";
import { AdminToastProvider } from "@/components/admin/context/AdminToastContext";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { AdminOverview } from "@/components/admin/overview/AdminOverview";
import { loadAdminBundle } from "@/components/admin/hooks/useAdminApi";
import { ADMIN_SECTIONS } from "@/components/admin/types";
import type { AdminAccess, AdminSection, AdminStats, AdminData } from "@/components/admin/types";
import type { AdminLiveEvent } from "@/components/admin/AdminV3Panel";

// Chargement paresseux par panel (P4.1) : chaque section devient un chunk
// séparé au lieu d'un unique bundle admin. Overview reste statique (affiché en
// premier écran). ssr:false : l'admin est client-only, derrière auth.
const panelLoading = () => (
  <div className="flex justify-center py-20">
    <Spinner className="h-8 w-8" />
  </div>
);
const InboxPanel = dynamic(() => import("@/components/admin/inbox/InboxPanel").then((m) => m.InboxPanel), { loading: panelLoading, ssr: false });
const ContentPanel = dynamic(() => import("@/components/admin/content/ContentPanel").then((m) => m.ContentPanel), { loading: panelLoading, ssr: false });
const TerritoryPanel = dynamic(() => import("@/components/admin/territory/TerritoryPanel").then((m) => m.TerritoryPanel), { loading: panelLoading, ssr: false });
const CommunityPanel = dynamic(() => import("@/components/admin/community/CommunityPanel").then((m) => m.CommunityPanel), { loading: panelLoading, ssr: false });
const DonationsPanel = dynamic(() => import("@/components/admin/donations/DonationsPanel").then((m) => m.DonationsPanel), { loading: panelLoading, ssr: false });
const AdminV3Panel = dynamic(() => import("@/components/admin/AdminV3Panel").then((m) => m.AdminV3Panel), { loading: panelLoading, ssr: false });
const AdminDesignPanel = dynamic(() => import("@/components/admin/AdminDesignPanel").then((m) => m.AdminDesignPanel), { loading: panelLoading, ssr: false });
const I18nPanel = dynamic(() => import("@/components/admin/i18n/I18nPanel").then((m) => m.I18nPanel), { loading: panelLoading, ssr: false });
const IdentityPanel = dynamic(() => import("@/components/admin/identity/IdentityPanel").then((m) => m.IdentityPanel), { loading: panelLoading, ssr: false });
const PagesPanel = dynamic(() => import("@/components/admin/pages/PagesPanel").then((m) => m.PagesPanel), { loading: panelLoading, ssr: false });
const PartnersPanel = dynamic(() => import("@/components/admin/partners/PartnersPanel").then((m) => m.PartnersPanel), { loading: panelLoading, ssr: false });
const AuditPanel = dynamic(() => import("@/components/admin/audit/AuditPanel").then((m) => m.AuditPanel), { loading: panelLoading, ssr: false });

type Props = { access: AdminAccess };

function DashboardBody({
  section,
  stats,
  data,
  liveEvents,
  onReload,
}: {
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
          initialEvents={liveEvents as unknown as AdminLiveEvent[]}
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

const VALID_SECTIONS = new Set<string>(ADMIN_SECTIONS);

function DashboardShell({ access }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSection = searchParams.get("section");
  const section: AdminSection =
    rawSection && VALID_SECTIONS.has(rawSection) ? (rawSection as AdminSection) : "overview";

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [liveEvents, setLiveEvents] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Navigation par URL (?section=…) : deep-link partageable + bouton retour.
  const goToSection = useCallback(
    (next: AdminSection) => {
      const query = next === "overview" ? "" : `?section=${next}`;
      router.push(`/admin/dashboard${query}`, { scroll: false });
    },
    [router]
  );

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
          onChange={goToSection}
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
          <main id="main-content" className="flex-1 overflow-auto p-6">
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

export function AdminDashboard({ access }: Props) {
  // useSearchParams exige une frontière Suspense (App Router).
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-admin-bg">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <DashboardShell access={access} />
    </Suspense>
  );
}
