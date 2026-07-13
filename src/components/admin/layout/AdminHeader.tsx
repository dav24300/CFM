"use client";

import { LogOut, RefreshCw, Menu, Bell, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AdminAccess, AdminSection, AdminStats } from "@/components/admin/types";
import { ADMIN_SECTION_META } from "@/components/admin/layout/sections";
import { AdminThemeToggle } from "@/components/admin/layout/AdminThemeToggle";

type Props = {
  section: AdminSection;
  access: AdminAccess;
  stats: AdminStats | null;
  onRefresh: () => void;
  loading: boolean;
  onLogout: () => void;
  onMenuToggle?: () => void;
};

const ROLE_LABELS: Record<AdminAccess, string> = {
  admin: "Administrateur",
  volunteer: "Bénévole",
};

export function AdminHeader({ section, access, stats, onRefresh, loading, onLogout, onMenuToggle }: Props) {
  const meta = ADMIN_SECTION_META[section];
  const alerts =
    (stats?.new_help || 0) + (stats?.pending_memberships || 0) + (stats?.pending_users || 0);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-admin-border bg-admin-surface/85 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-admin-ctrl p-1.5 text-admin-muted hover:bg-admin-bg lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <nav className="flex items-center gap-1 text-[11px] font-medium text-admin-muted-2" aria-label="Fil d'Ariane">
            <span>Admin</span>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <span className="truncate text-admin-muted">{meta.label}</span>
          </nav>
          <h1 className="flex items-center gap-2 truncate font-display text-admin-h1 font-bold text-admin-ink">
            <meta.icon className="h-[18px] w-[18px] shrink-0 text-admin-accent" aria-hidden />
            <span className="truncate">{meta.label}</span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <AdminThemeToggle />

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-admin-ctrl border border-admin-border text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-ink disabled:opacity-50"
          aria-label="Actualiser les données"
          title="Actualiser"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>

        <div
          className="relative flex h-9 w-9 items-center justify-center rounded-admin-ctrl border border-admin-border text-admin-muted"
          aria-label={alerts > 0 ? `${alerts} élément(s) à traiter` : "Aucune alerte"}
          title={alerts > 0 ? `${alerts} élément(s) à traiter` : "Aucune alerte"}
        >
          <Bell className="h-4 w-4" />
          {alerts > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-[16px] items-center justify-center rounded-full bg-admin-danger-fg px-1 text-[10px] font-bold leading-none text-white">
              {alerts > 99 ? "99+" : alerts}
            </span>
          )}
        </div>

        <div className="mx-1 hidden h-6 w-px bg-admin-border sm:block" aria-hidden />

        <div className="hidden items-center gap-2 sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-admin-accent/10 font-display text-[13px] font-bold text-admin-accent">
            {ROLE_LABELS[access].charAt(0)}
          </span>
          <span className="text-[12.5px] font-medium text-admin-muted">{ROLE_LABELS[access]}</span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex h-9 items-center gap-1.5 rounded-admin-ctrl bg-admin-deep px-3 text-sm font-medium text-white transition-colors hover:bg-admin-deep/90"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
