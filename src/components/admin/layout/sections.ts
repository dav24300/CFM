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
  type LucideIcon,
} from "lucide-react";
import type { AdminSection } from "@/components/admin/types";

export type SectionMeta = {
  id: AdminSection;
  label: string;
  /** Sous-titre affiché sous le titre de page (contexte du panneau). */
  subtitle: string;
  icon: LucideIcon;
};

export type SectionGroup = {
  label: string;
  items: SectionMeta[];
};

/**
 * Navigation admin groupée par tâche (reflète les tiers de l'Overview).
 * Source unique consommée par la sidebar (groupes) et le header (lookup titre).
 */
export const ADMIN_NAV: SectionGroup[] = [
  {
    label: "Pilotage",
    items: [
      { id: "overview", label: "Vue d'ensemble", subtitle: "Activité, contenu et éléments à traiter", icon: LayoutDashboard },
      { id: "inbox", label: "Boîte de réception", subtitle: "Demandes d'aide, adhésions, contacts et pétitions", icon: Inbox },
    ],
  },
  {
    label: "Contenu & mobilisation",
    items: [
      { id: "content", label: "Contenu", subtitle: "Actualités, études et campagnes", icon: FileText },
      { id: "territory", label: "Actions & territoire", subtitle: "Actions de terrain et cartographie", icon: MapPin },
      { id: "live", label: "Live & mobilisation", subtitle: "Événements en direct et modération du chat", icon: Radio },
    ],
  },
  {
    label: "Communauté & dons",
    items: [
      { id: "community", label: "Communauté", subtitle: "Membres, comptes et liens familiaux", icon: Users },
      { id: "donations", label: "Dons & transparence", subtitle: "Dons, reçus et transparence financière", icon: Wallet },
    ],
  },
  {
    label: "Configuration",
    items: [
      { id: "design", label: "Médias & design", subtitle: "Bibliothèque de médias et apparence", icon: ImageIcon },
      { id: "identity", label: "Identité & contact", subtitle: "Coordonnées, réseaux et informations légales", icon: Building2 },
      { id: "pages", label: "Pages structurelles", subtitle: "Pages fixes et contenus structurels du site", icon: LayoutTemplate },
      { id: "i18n", label: "Langues & textes", subtitle: "Langues et libellés traduisibles", icon: Globe },
      { id: "partners", label: "Partenaires", subtitle: "Partenaires et soutiens de l'association", icon: Handshake },
    ],
  },
  {
    label: "Journal",
    items: [
      { id: "audit", label: "Journal & exports", subtitle: "Journal d'administration et exports de données", icon: ClipboardList },
    ],
  },
];

/** Lookup id → métadonnées (titre/sous-titre/icône) pour le header. */
export const ADMIN_SECTION_META = Object.fromEntries(
  ADMIN_NAV.flatMap((g) => g.items).map((s) => [s.id, s])
) as Record<AdminSection, SectionMeta>;
