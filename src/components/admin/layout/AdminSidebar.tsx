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
  { id: "i18n", label: "Langues & textes", icon: Globe },
  { id: "partners", label: "Partenaires", icon: Handshake },
  { id: "audit", label: "Journal & exports", icon: ClipboardList },
];

function badgeForSection(id: AdminSection, stats: AdminStats | null): number {
  if (!stats) return 0;
  switch (id) {
    case "inbox":
      return (stats.new_help || 0) + (stats.pending_memberships || 0) + (stats.contacts || 0);
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
};

export function AdminSidebar({ active, onChange, stats }: Props) {
  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-white">
      <nav className="flex flex-col gap-0.5 p-3">
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const badge = badgeForSection(id, stats);
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                isActive
                  ? "bg-cfm-navy text-white"
                  : "text-cfm-earth hover:bg-cfm-cream hover:text-cfm-navy"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge > 0 && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-bold",
                    isActive ? "bg-cfm-gold text-cfm-navy" : "bg-red-600 text-white"
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
  );
}
