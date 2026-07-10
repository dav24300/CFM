import seedData from "../../../data/store.seed.json";
import type { Store } from "@/domain/entities/store";
import type {
  User,
  FamilyLink,
  Donation,
  Petition,
  PetitionSignature,
  HelpRequestUpdate,
  PasswordResetToken,
} from "@/domain/entities/v2";
import type {
  LiveEvent,
  LiveChatMessage,
  LivePoll,
  LivePollVote,
  PushSubscription,
} from "@/domain/entities/v3";
import type {
  PortalEvent,
  MemberMessage,
  MemberResource,
} from "@/domain/entities/v4";

export function loadSeedStore(): Store {
  // Le JSON de seed ne contient pas les collections récentes ; migrateV4 les normalise.
  const store = structuredClone(seedData) as unknown as Store;
  migrateV2(store);
  migrateV3(store);
  migrateV4(store);
  return store;
}

export function defaultStore(): Store {
  const now = new Date().toISOString();
  return {
    _counters: { global: 100 },
    news: [
      {
        id: 1,
        title: "Rassemblement des familles militaires à la FIKIN 2025",
        slug: "rassemblement-fikin-2025",
        excerpt:
          "Un moment historique de rassemblement et de plaidoyer pour les droits des dépendants des militaires.",
        content:
          "En 2025, CFM a organisé un rassemblement majeur des familles de militaires à la Foire Internationale de Kinshasa (FIKIN). Cet événement a permis de donner une voix collective aux veuves, orphelins, conjoints et enfants de militaires, et de présenter nos recommandations aux institutions nationales et internationales.",
        category: "evenement",
        published: 1,
        created_at: now,
      },
      {
        id: 2,
        title: "Lancement de la campagne d'autonomisation des veuves",
        slug: "campagne-autonomisation-veuves",
        excerpt:
          "Former et accompagner les veuves de militaires vers l'entrepreneuriat.",
        content:
          "CFM lance une campagne nationale pour l'autonomisation économique des veuves de militaires par l'entrepreneuriat. Des ateliers de formation, un accompagnement personnalisé et un réseau de solidarité sont mis en place dans plusieurs provinces.",
        category: "campagne",
        published: 1,
        created_at: now,
      },
    ],
    studies: [
      {
        id: 3,
        title: "Analyse des conditions sociales des dépendants militaires en RDC",
        slug: "analyse-conditions-sociales-2025",
        summary:
          "Étude sur les faiblesses du système de protection des familles de militaires.",
        content:
          "Cette étude identifie les lacunes dans la protection sociale, l'accès à l'éducation, au logement et aux soins de santé pour les dépendants des militaires. Elle propose des recommandations concrètes pour une réforme structurelle.",
        file_url: null,
        published: 1,
        created_at: now,
      },
    ],
    campaigns: [
      {
        id: 4,
        title: "Autonomisation des femmes et veuves",
        slug: "autonomisation-femmes-veuves",
        description:
          "Entrepreneuriat et indépendance économique pour les femmes et veuves de militaires.",
        content:
          "Programme d'accompagnement vers l'entrepreneuriat : formation, microcrédit, mentorat et réseau de femmes entrepreneures.",
        image_url: null,
        active: 1,
        created_at: now,
      },
      {
        id: 5,
        title: "Santé sexuelle des femmes dans les camps militaires",
        slug: "sante-sexuelle-camps",
        description:
          "Sensibilisation et accès aux soins de santé reproductive.",
        content:
          "Campagne de sensibilisation et de plaidoyer pour l'amélioration de l'accès aux soins de santé sexuelle et reproductive des femmes vivant dans et autour des camps militaires.",
        image_url: null,
        active: 1,
        created_at: now,
      },
    ],
    partners: [
      {
        id: 6,
        name: "Institutions nationales",
        logo_url: null,
        website: null,
        description: "Partenariats avec les institutions de la RDC",
        sort_order: 1,
      },
      {
        id: 7,
        name: "Organisations internationales",
        logo_url: null,
        website: null,
        description: "Plaidoyer auprès des instances internationales",
        sort_order: 2,
      },
    ],
    testimonials: [
      {
        id: 8,
        author: "Marie K.",
        role: "Veuve de militaire, Kinshasa",
        content:
          "CFM m'a donné une voix quand je me sentais invisible. Grâce à leur accompagnement, j'ai pu lancer ma petite entreprise et subvenir aux besoins de mes enfants.",
        anonymous: 0,
        published: 1,
        created_at: now,
      },
      {
        id: 9,
        author: "Anonyme",
        role: "Orphelin de militaire",
        content:
          "Derrière chaque militaire, il y a une famille. CFM comprend notre quotidien et se bat pour que nos droits soient reconnus.",
        anonymous: 1,
        published: 1,
        created_at: now,
      },
    ],
    actions: [
      {
        id: 10,
        province: "Kinshasa",
        title: "Rassemblement FIKIN 2025",
        description: "Grand rassemblement des familles militaires",
        date: "2025-01-15",
        type: "evenement",
      },
      {
        id: 11,
        province: "Nord-Kivu",
        title: "Atelier autonomisation femmes",
        description: "Formation entrepreneuriat pour veuves",
        date: "2025-03-10",
        type: "atelier",
      },
      {
        id: 12,
        province: "Kasaï-Oriental",
        title: "Plaidoyer provincial",
        description: "Rencontre avec les autorités locales",
        date: "2025-02-20",
        type: "plaidoyer",
      },
    ],
    memberships: [],
    help_requests: [],
    newsletter: [],
    contact_messages: [],
    press_releases: [
      {
        id: 13,
        title: "CFM appelle à une réforme de la protection des familles militaires",
        slug: "communique-reforme-protection",
        content:
          "L'ASBL Cri de Familles Militaires publie un communiqué appelant le gouvernement et les partenaires internationaux à renforcer la protection sociale, économique et éducative des dépendants des militaires en RDC.",
        file_url: null,
        published: 1,
        created_at: now,
      },
    ],
    site_settings: {
      social_links: JSON.stringify({
        facebook: "https://facebook.com/cfmasbl",
        twitter: "https://x.com/cfmasbl",
        youtube: "https://youtube.com/@cfmasbl",
        linkedin: "https://linkedin.com/company/cfmasbl",
      }),
    },
    users: [] as User[],
    family_links: [] as FamilyLink[],
    donations: [] as Donation[],
    petitions: [] as Petition[],
    petition_signatures: [] as PetitionSignature[],
    help_request_updates: [] as HelpRequestUpdate[],
    password_reset_tokens: [] as PasswordResetToken[],
    live_events: [] as LiveEvent[],
    live_chat_messages: [] as LiveChatMessage[],
    live_polls: [] as LivePoll[],
    live_poll_votes: [] as LivePollVote[],
    push_subscriptions: [] as PushSubscription[],
    events: [] as PortalEvent[],
    member_messages: [] as MemberMessage[],
    member_resources: [] as MemberResource[],
  };
}

export function migrateV2(store: Store): boolean {
  let changed = false;
  if (!store.users) { store.users = []; changed = true; }
  if (!store.family_links) { store.family_links = []; changed = true; }
  if (!store.donations) { store.donations = []; changed = true; }
  if (!store.petitions) { store.petitions = []; changed = true; }
  if (!store.petition_signatures) { store.petition_signatures = []; changed = true; }
  if (!store.help_request_updates) { store.help_request_updates = []; changed = true; }
  if (!store.password_reset_tokens) { store.password_reset_tokens = []; changed = true; }

  if (store.petitions.length === 0) {
    const now = new Date().toISOString();
    store._counters.global = (store._counters.global || 100) + 1;
    store.petitions.push({
      id: store._counters.global,
      title: "Réforme de la protection des familles militaires",
      slug: "reforme-protection-familles",
      description:
        "Appelons le gouvernement à renforcer la protection sociale, économique et éducative des dépendants des militaires.",
      content:
        "Cette pétition vise à obtenir une réforme structurelle de la protection des veuves, orphelins et familles de militaires en RDC.",
      goal: 1000,
      signatures_count: 0,
      active: 1,
      created_at: now,
    });
    store._counters.global += 1;
    store.petitions.push({
      id: store._counters.global,
      title: "Autonomisation des veuves de militaires",
      slug: "autonomisation-veuves-petition",
      description:
        "Soutenons l'entrepreneuriat et la formation professionnelle des veuves de militaires.",
      content: null,
      goal: 500,
      signatures_count: 0,
      active: 1,
      created_at: now,
    });
    changed = true;
  }
  return changed;
}

export function migrateV3(store: Store): boolean {
  let changed = false;
  if (!store.live_events) { store.live_events = []; changed = true; }
  if (!store.live_chat_messages) { store.live_chat_messages = []; changed = true; }
  if (!store.live_polls) { store.live_polls = []; changed = true; }
  if (!store.live_poll_votes) { store.live_poll_votes = []; changed = true; }
  if (!store.push_subscriptions) { store.push_subscriptions = []; changed = true; }

  if (store.live_events.length === 0) {
    const now = new Date().toISOString();
    store._counters.global = (store._counters.global || 100) + 1;
    store.live_events.push({
      id: store._counters.global,
      title: "FIKIN 2025 — Rassemblement des familles militaires",
      slug: "fikin-2025",
      description:
        "Replay du rassemblement historique des familles de militaires à la Foire Internationale de Kinshasa.",
      status: "replay",
      youtube_id: null,
      stream_url: null,
      replay_url: "https://youtube.com/@cfmasbl",
      chat_moderation: 1,
      viewer_count: 0,
      started_at: now,
      ended_at: now,
      created_at: now,
    });
    changed = true;
  }
  return changed;
}

export function migrateV4(store: Store): boolean {
  let changed = false;
  if (!store.events) { store.events = []; changed = true; }
  if (!store.member_messages) { store.member_messages = []; changed = true; }
  if (!store.member_resources) { store.member_resources = []; changed = true; }

  if (store.events.length === 0) {
    const now = new Date().toISOString();
    // Dates relatives au futur (garantit des événements "à venir" quelle que soit la date).
    const futureDate = (days: number): string =>
      new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
    const base = (store._counters.global || 100) + 1;
    store.events.push(
      {
        id: base,
        title: "Atelier entrepreneuriat pour veuves",
        description:
          "Formation pratique à la création de petites entreprises et à l'accès au microcrédit.",
        province: "Nord-Kivu",
        date: futureDate(21),
        time: "09:00",
        type: "atelier",
        location: "Goma — Maison des familles",
        capacity: 40,
        rsvp_user_ids: [],
        created_at: now,
      },
      {
        id: base + 1,
        title: "Rencontre des familles militaires — Kinshasa",
        description: "Temps d'échange, d'écoute et d'orientation pour les familles.",
        province: "Kinshasa",
        date: futureDate(38),
        time: "14:00",
        type: "rencontre",
        location: "Kinshasa — Centre communautaire",
        capacity: null,
        rsvp_user_ids: [],
        created_at: now,
      },
      {
        id: base + 2,
        title: "Distribution de kits scolaires",
        description: "Remise de fournitures aux enfants et orphelins de militaires.",
        province: "Haut-Katanga",
        date: futureDate(60),
        time: "10:00",
        type: "distribution",
        location: "Lubumbashi",
        capacity: 120,
        rsvp_user_ids: [],
        created_at: now,
      }
    );
    store._counters.global = base + 2;
    changed = true;
  }

  if (store.member_resources.length === 0) {
    const now = new Date().toISOString();
    const base = (store._counters.global || 100) + 1;
    store.member_resources.push(
      {
        id: base,
        title: "Obtenir une pension de survie",
        category: "Démarches",
        description:
          "Guide pas à pas pour constituer le dossier de pension de survie des veuves de militaires.",
        file_url: null,
        external_url: null,
        created_at: now,
      },
      {
        id: base + 1,
        title: "Inscrire un orphelin à l'école",
        category: "Éducation",
        description: "Documents requis et bourses disponibles pour la scolarisation.",
        file_url: null,
        external_url: null,
        created_at: now,
      },
      {
        id: base + 2,
        title: "Accès aux soins de santé reproductive",
        category: "Santé",
        description: "Où trouver des services adaptés et gratuits près des camps militaires.",
        file_url: null,
        external_url: null,
        created_at: now,
      },
      {
        id: base + 3,
        title: "Faire valoir ses droits juridiques",
        category: "Juridique",
        description: "Contacts et procédures pour un accompagnement juridique gratuit.",
        file_url: null,
        external_url: null,
        created_at: now,
      }
    );
    store._counters.global = base + 3;
    changed = true;
  }

  return changed;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "");
}

export function nextId(store: Store): number {
  store._counters.global = (store._counters.global || 0) + 1;
  return store._counters.global;
}
