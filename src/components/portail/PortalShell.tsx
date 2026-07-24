"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutList,
  LifeBuoy,
  MessageCircle,
  HandHeart,
  Image as ImageIcon,
  FileText,
  Calendar,
  Users,
  HandCoins,
  FileSignature,
  Activity,
  Menu,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { PORTAL_ROLE_LABELS, type PortalRole } from "@/lib/portal-role";
import { PortalRoleContext } from "@/components/portail/portal-role-context";
import { cn } from "@/lib/utils/cn";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import type { Locale } from "@/lib/i18n";

type NavItem = {
  key: string;
  href: string;
  label: string;
  icon: typeof LayoutList;
  badge?: string;
  roleOnly?: PortalRole;
  separated?: boolean;
};

const NAV: NavItem[] = [
  { key: "accueil", href: "/membre", label: "Fil d'annonces", icon: LayoutList },
  { key: "aide", href: "/membre/aide", label: "Mes demandes d'aide", icon: LifeBuoy, roleOnly: "famille" },
  { key: "messages", href: "/membre/messages", label: "Messagerie", icon: MessageCircle },
  { key: "entraide", href: "/membre/entraide", label: "Entraide", icon: HandHeart },
  { key: "medias", href: "/membre/medias", label: "Médias & galerie", icon: ImageIcon },
  { key: "ressources", href: "/membre/ressources", label: "Ressources & démarches", icon: FileText },
  { key: "evenements", href: "/membre/evenements", label: "Événements", icon: Calendar },
  { key: "famille", href: "/membre/famille", label: "Ma famille", icon: Users, roleOnly: "famille" },
  { key: "dons", href: "/membre/dons", label: "Dons & reçus", icon: HandCoins },
  { key: "petitions", href: "/membre/petitions", label: "Pétitions", icon: FileSignature },
  {
    key: "coordination",
    href: "/membre/coordination",
    label: "Coordination",
    icon: Activity,
    roleOnly: "coordinateur",
    separated: true,
  },
];

type Props = {
  name: string;
  initials: string;
  initialRole: PortalRole;
  locale: Locale;
  children: ReactNode;
};

export function PortalShell({ name, initials, initialRole, locale, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Ferme le tiroir à chaque changement de route.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/membre") return pathname === "/membre";
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function logout() {
    await fetch("/api/member/logout", { method: "POST" });
    router.push("/");
  }

  const visibleNav = NAV.filter((n) => !n.roleOnly || n.roleOnly === initialRole);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Scrim mobile */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-[70] bg-site-deep/40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "z-[80] flex h-screen w-[262px] flex-none flex-col overflow-y-auto bg-site-deep text-white transition-transform",
          "fixed inset-y-0 left-0 lg:sticky lg:top-0 lg:translate-x-0",
          drawerOpen ? "translate-x-0" : "-translate-x-[105%] lg:translate-x-0"
        )}
      >
        <div className="border-b border-white/10 px-[22px] py-[18px]">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-[34px] w-[34px] flex-none items-center justify-center bg-white text-site-deep">
              <Shield className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <span className="font-serif text-base font-semibold text-white">Portail CFM</span>
          </Link>
        </div>

        <Link
          href="/membre/profil"
          className="flex items-center gap-3 border-b border-white/10 px-[22px] py-[18px] hover:bg-white/[0.04]"
        >
          <span className="flex h-[42px] w-[42px] flex-none items-center justify-center bg-site-navy font-serif text-[15px] font-semibold text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{name}</span>
            <span className="mt-0.5 block text-[11px] font-medium text-site-light">
              {PORTAL_ROLE_LABELS[initialRole]}
            </span>
          </span>
          <ChevronRight className="h-[15px] w-[15px] text-white/50" aria-hidden />
        </Link>

        <nav className="flex flex-1 flex-col gap-px py-3 text-sm font-medium">
          {visibleNav.map((n) => {
            const on = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.key}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 border-l-[3px] px-[22px] py-3 transition-colors",
                  n.separated && "mt-1.5 border-t border-white/[0.08] pt-[15px]",
                  on
                    ? "border-l-site-light bg-site-navy text-white"
                    : "border-l-transparent text-white/80 hover:bg-white/[0.04]"
                )}
              >
                <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden />
                <span className="flex-1">{n.label}</span>
                {n.badge && (
                  <span className="bg-site-live px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {n.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-[22px] py-4">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2.5 text-[13px] font-medium text-white/60 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Colonne principale */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-[60] flex items-center gap-4 border-b border-site-hairline bg-white/95 px-6 py-3 backdrop-blur">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-1 text-site-ink lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="ml-auto flex items-center gap-3">
            <LocaleSwitcher current={locale} />
          </div>
        </header>

        <main id="main-content" className="flex-1 bg-site-surface">
          <PortalRoleContext.Provider value={initialRole}>{children}</PortalRoleContext.Provider>
        </main>
      </div>
    </div>
  );
}
