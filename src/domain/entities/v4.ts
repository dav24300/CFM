// Entités du portail membre (Phase 3 — backend greenfield).

export type PortalEventType =
  | "atelier"
  | "rencontre"
  | "formation"
  | "distribution"
  | "autre";

export type PortalEvent = {
  id: number;
  title: string;
  description: string;
  province: string;
  date: string; // ISO date (YYYY-MM-DD)
  time: string; // "09:00"
  type: PortalEventType;
  location: string;
  capacity: number | null;
  rsvp_user_ids: number[];
  created_at: string;
};

export type MemberMessage = {
  id: number;
  user_id: number; // le membre concerné par le fil
  direction: "in" | "out"; // in = reçu (référent → membre), out = envoyé (membre → CFM)
  author_name: string;
  subject: string | null;
  body: string;
  read: number; // 0 | 1
  created_at: string;
};

export type MemberResource = {
  id: number;
  title: string;
  category: string; // Démarches | Santé | Éducation | Juridique | Économique
  description: string;
  file_url: string | null;
  external_url: string | null;
  created_at: string;
};
