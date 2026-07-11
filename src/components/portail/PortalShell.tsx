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
  Bell,
  Search,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { PORTAL_ROLE_LABELS, type PortalRole } from "@/lib/portal-role";
import { PortalRoleContext } from "@/components/portail/portal-role-context";
import { cn } from "@/lib/utils/cn";

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
  { key: "accueil", href: "/portail", label: "Fil d'annonces", icon: LayoutList },
  { key: "aide", href: "/portail/aide", label: "Mes demandes d'aide", icon: LifeBuoy, roleOnly: "famille" },
  { key: "messages", href: "/portail/messages", label: "Messagerie", icon: MessageCircle, badge: "2" },
  { key: "entraide", href: "/portail/entraide", label: "Entraide", icon: HandHeart },
  { key: "medias", href: "/portail/medias", label: "Médias & galerie", icon: ImageIcon },
  { key: "ressources", href: "/portail/ressources", label: "Ressources & démarches", icon: FileText },
  { key: "evenements", href: "/portail/evenements", label: "Événements", icon: Calendar },
  { key: "famille", href: "/portail/famille", label: "Ma famille", icon: Users, roleOnly: "famille" },
  { key: "dons", href: "/portail/dons", label: "Dons & reçus", icon: HandCoins },
  { key: "petitions", href: "/portail/petitions", label: "Pétitions", icon: FileSignature },
  {
    key: "coordination",
    href: "/portail/coordination",
    label: "Coordination",
    icon: Activity,
    roleOnly: "coordinateur",
    separated: true,
  },
];

const LANGS = ["FR", "EN", "LN", "SW"];

type Props = {
  name: string;
  initials: string;
  initialRole: PortalRole;
  children: ReactNode;
};

export function PortalShell({ name, initials, initialRole, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<PortalRole>(initialRole);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [lang, setLang] = useState("FR");

  // Ferme le tiroir à chaque changement de route.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  function isActive(href: string) {
    if (href === "/portail") return pathname === "/portail";
    return pathname === href || pathname.startsWith(href + "/");
  }

  async function logout() {
    await fetch("/api/member/logout", { method: "POST" });
    router.push("/");
  }

  const visibleNav = NAV.filter((n) => !n.roleOnly || n.roleOnly === role);

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
          href="/portail/profil"
          className="flex items-center gap-3 border-b border-white/10 px-[22px] py-[18px] hover:bg-white/[0.04]"
        >
          <span className="flex h-[42px] w-[42px] flex-none items-center justify-center bg-site-navy font-serif text-[15px] font-semibold text-white">
            {initials}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{name}</span>
            <span className="mt-0.5 block text-[11px] font-medium text-site-light">
              {PORTAL_ROLE_LABELS[role]}
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
          <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.05em] text-white/45">
            Rôle (démo)
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as PortalRole)}
            className="w-full border border-white/15 bg-site-navy px-2.5 py-2 text-[13px] font-medium text-white"
          >
            <option value="famille">Famille militaire</option>
            <option value="benevole">Bénévole</option>
            <option value="coordinateur">Coordinateur provincial</option>
          </select>
          <button
            type="button"
            onClick={logout}
            className="mt-3.5 flex items-center gap-2.5 text-[13px] font-medium text-white/60 hover:text-white"
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

          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-site-muted-2" aria-hidden />
            <input
              type="search"
              placeholder="Rechercher dans le portail…"
              className="w-full border border-site-hairline bg-site-surface py-2 pl-9 pr-3 text-sm focus:border-site-primary focus:outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-1 sm:flex">
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={cn(
                    "px-2 py-1 text-xs font-semibold transition-colors",
                    lang === l ? "bg-site-pale text-site-primary" : "text-site-muted-2 hover:text-site-primary"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="relative p-1.5 text-site-muted hover:text-site-primary"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1 top-1 h-2 w-2 bg-site-live" />
            </button>
          </div>
        </header>

        <main className="flex-1 bg-site-surface">
          <PortalRoleContext.Provider value={role}>{children}</PortalRoleContext.Provider>
        </main>
      </div>
    </div>
  );
}
