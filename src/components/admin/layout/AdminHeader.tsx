"use client";

import { LogOut, RefreshCw, Menu } from "lucide-react";
import { SITE } from "@/lib/constants";
import type { AdminAccess, AdminStats } from "@/components/admin/types";
import { AdminThemeToggle } from "@/components/admin/layout/AdminThemeToggle";

type Props = {
  access: AdminAccess;
  stats: AdminStats | null;
  onRefresh: () => void;
  loading: boolean;
  onLogout: () => void;
  onMenuToggle?: () => void;
};

const ROLE_LABELS: Record<AdminAccess, string> = {
  admin: "Administrateur",
  volunteer: "Bénévole (quasi-admin)",
};

export function AdminHeader({ access, stats, onRefresh, loading, onLogout, onMenuToggle }: Props) {
  const alerts =
    (stats?.new_help || 0) +
    (stats?.pending_memberships || 0) +
    (stats?.pending_users || 0);

  return (
    <header className="flex items-center justify-between border-b border-admin-border bg-admin-surface px-6 py-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="rounded-admin-ctrl p-1.5 text-admin-muted hover:bg-admin-bg lg:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
        <h1 className="font-display text-xl font-bold text-admin-ink">
          Centre de commandement — {SITE.name}
        </h1>
        <p className="text-sm text-admin-muted">
          Connecté en tant que <strong>{ROLE_LABELS[access]}</strong>
          {alerts > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              {alerts} alerte{alerts > 1 ? "s" : ""}
            </span>
          )}
        </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AdminThemeToggle />
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1 rounded-lg border border-admin-border px-3 py-2 text-sm text-admin-muted hover:bg-admin-bg disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1 rounded-lg bg-admin-deep px-3 py-2 text-sm text-white hover:bg-admin-deep/90"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </header>
  );
}
