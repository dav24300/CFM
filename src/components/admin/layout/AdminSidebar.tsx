"use client";

import { Palette } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AdminSection, AdminStats } from "@/components/admin/types";
import { ADMIN_NAV } from "@/components/admin/layout/sections";

function badgeForSection(id: AdminSection, stats: AdminStats | null): number {
  if (!stats) return 0;
  switch (id) {
    case "inbox":
      return (
        (stats.new_help || 0) +
        (stats.pending_memberships || 0) +
        (stats.contacts || 0) +
        (stats.new_petition_signatures || 0)
      );
    case "community":
      return (stats.pending_users || 0) + (stats.pending_family_links || 0);
    case "live":
      return stats.pending_chat || 0;
    default:
      return 0;
  }
}

type Props = {
  active: AdminSection;
  onChange: (section: AdminSection) => void;
  stats: AdminStats | null;
  open?: boolean;
  onClose?: () => void;
};

export function AdminSidebar({ active, onChange, stats, open = false, onClose }: Props) {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          "z-50 flex h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-admin-border bg-admin-surface transition-transform",
          "fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:translate-x-0",
          open ? "translate-x-0 shadow-admin-overlay lg:shadow-none" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Marque */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-admin-ctrl bg-admin-accent font-display text-sm font-bold text-admin-accent-fg shadow-admin-rest">
            C
          </span>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-bold text-admin-ink">CFM Admin</div>
            <div className="text-[11px] text-admin-muted-2">Console de gestion</div>
          </div>
        </div>

        {/* Navigation groupée */}
        <nav className="flex flex-1 flex-col gap-5 px-3 pb-4">
          {ADMIN_NAV.map((group) => (
            <div key={group.label} className="flex flex-col gap-0.5">
              <div className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-admin-muted-2">
                {group.label}
              </div>
              {group.items.map(({ id, label, icon: Icon }) => {
                const badge = badgeForSection(id, stats);
                const isActive = active === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      onChange(id);
                      onClose?.();
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "group flex w-full items-center gap-3 rounded-admin-ctrl px-3 py-2 text-left text-[13.5px] font-medium transition-colors",
                      isActive
                        ? "bg-admin-accent text-admin-accent-fg shadow-admin-rest"
                        : "text-admin-muted hover:bg-admin-bg hover:text-admin-ink"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[17px] w-[17px] shrink-0 transition-colors",
                        isActive ? "text-admin-accent-fg" : "text-admin-muted-2 group-hover:text-admin-ink"
                      )}
                    />
                    <span className="flex-1 truncate">{label}</span>
                    {badge > 0 && (
                      <span
                        className={cn(
                          "min-w-[20px] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold leading-none",
                          isActive ? "bg-admin-accent-fg/20 text-admin-accent-fg" : "bg-admin-danger-fg text-white"
                        )}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Carte utilitaire */}
        <div className="mt-auto p-3">
          <div className="rounded-admin-card border border-admin-border bg-admin-bg p-3.5">
            <div className="flex items-center gap-2 text-admin-ink">
              <Palette className="h-4 w-4 text-admin-accent" />
              <span className="text-[12.5px] font-semibold">Design system</span>
            </div>
            <p className="mt-1 text-[11.5px] leading-snug text-admin-muted">
              Composants, tokens et charte de la console.
            </p>
            <a
              href="/admin/style-guide"
              className="mt-2 inline-block text-[12px] font-semibold text-admin-accent hover:underline"
            >
              Ouvrir le guide →
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
