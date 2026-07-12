"use client";

import {
  LayoutDashboard,
  Inbox,
  FileText,
  MapPin,
  Users,
  Wallet,
  Radio,
  Image as ImageIcon,
  Globe,
  Handshake,
  ClipboardList,
  Building2,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { AdminSection, AdminStats } from "@/components/admin/types";

const SECTIONS: {
  id: AdminSection;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { id: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "inbox", label: "Boîte de réception", icon: Inbox },
  { id: "content", label: "Contenu", icon: FileText },
  { id: "territory", label: "Actions & territoire", icon: MapPin },
  { id: "community", label: "Communauté", icon: Users },
  { id: "donations", label: "Dons & transparence", icon: Wallet },
  { id: "live", label: "Live & mobilisation", icon: Radio },
  { id: "design", label: "Médias & design", icon: ImageIcon },
  { id: "identity", label: "Identité & contact", icon: Building2 },
  { id: "pages", label: "Pages structurelles", icon: LayoutTemplate },
  { id: "i18n", label: "Langues & textes", icon: Globe },
  { id: "partners", label: "Partenaires", icon: Handshake },
  { id: "audit", label: "Journal & exports", icon: ClipboardList },
];

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
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />
      )}
      <aside
        className={cn(
          "z-50 flex h-screen w-64 shrink-0 flex-col overflow-y-auto bg-admin-sidebar text-white/70 transition-transform",
          "fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-admin-ctrl bg-admin-accent font-display text-sm font-bold text-white">
          C
        </span>
        <div className="leading-tight">
          <div className="font-display text-sm font-semibold text-white">CFM Admin</div>
          <div className="text-[11px] text-white/70">Console de gestion</div>
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 px-3 pb-6">
        {SECTIONS.map(({ id, label, icon: Icon }) => {
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
              className={cn(
                "flex w-full items-center gap-3 rounded-admin-ctrl border-l-2 px-3 py-2.5 text-left text-sm font-medium transition-colors",
                isActive
                  ? "border-admin-accent bg-admin-sidebar-active text-white"
                  : "border-transparent text-white/65 hover:bg-admin-surface/[0.06] hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    isActive ? "bg-admin-accent text-white" : "bg-admin-danger-fg text-white"
                  )}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
      </aside>
    </>
  );
}
