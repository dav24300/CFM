export const SITE = {
  name: "Cri de Familles Militaires",
  sigle: "CFM",
  tagline: "Défendre les droits des dépendants des militaires",
  quote:
    "Le vrai visage de la guerre sous toutes ses formes se retrouve dans le quotidien des personnes que vous avez décidé d'approcher.",
  founder: "Ngonga Mbana Glody",
  founded: 2018,
  country: "République Démocratique du Congo",
  email: "contact@cfmasbl.com",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+243 000 000 000",
};

export const PROVINCES_RDC = [
  "Bas-Uélé",
  "Équateur",
  "Haut-Katanga",
  "Haut-Lomami",
  "Haut-Uélé",
  "Ituri",
  "Kasaï",
  "Kasaï-Central",
  "Kasaï-Oriental",
  "Kinshasa",
  "Kongo-Central",
  "Kwango",
  "Kwilu",
  "Lomami",
  "Lualaba",
  "Mai-Ndombe",
  "Maniema",
  "Mongala",
  "Nord-Kivu",
  "Nord-Ubangi",
  "Sankuru",
  "Sud-Kivu",
  "Sud-Ubangi",
  "Tanganyika",
  "Tshopo",
  "Tshuapa",
];

export const AXES = [
  {
    slug: "social",
    title: "Social",
    icon: "heart",
    description:
      "Améliorer les conditions de vie des conjoints, veuves, orphelins et enfants de militaires.",
    details: [
      "Protection sociale renforcée",
      "Accompagnement des veuves et orphelins",
      "Soutien psychologique et communautaire",
      "Reconnaissance du sacrifice familial",
    ],
  },
  {
    slug: "economique",
    title: "Économique",
    icon: "briefcase",
    description:
      "Autonomisation des femmes et veuves par l'entrepreneuriat et l'accès aux ressources économiques.",
    details: [
      "Formation à l'entrepreneuriat",
      "Microcrédit et accompagnement",
      "Réseau de femmes entrepreneures",
      "Plaidoyer pour l'accès équitable aux aides",
    ],
  },
  {
    slug: "education",
    title: "Éducation",
    icon: "book",
    description:
      "Garantir l'accès à l'éducation et à la formation pour les enfants de militaires.",
    details: [
      "Scolarisation des orphelins",
      "Bourses et soutien scolaire",
      "Formation professionnelle",
      "Plaidoyer pour des politiques éducatives inclusives",
    ],
  },
  {
    slug: "environnement",
    title: "Environnement",
    icon: "leaf",
    description:
      "Améliorer le cadre de vie dans et autour des camps et quartiers militaires.",
    details: [
      "Conditions d'habitat décentes",
      "Accès à l'eau et à l'assainissement",
      "Espaces verts et qualité de vie",
      "Développement durable des communautés militaires",
    ],
  },
  {
    slug: "sante",
    title: "Santé",
    icon: "activity",
    description:
      "Santé sexuelle et reproductive des femmes dans les milieux des camps militaires.",
    details: [
      "Sensibilisation et prévention",
      "Accès aux soins de santé reproductive",
      "Plaidoyer pour des services adaptés",
      "Formation des agents de santé communautaires",
    ],
  },
];

export const MEMBERSHIP_TYPES = [
  {
    id: "famille",
    label: "Famille militaire",
    description:
      "Pour les conjoints, enfants, veuves et orphelins de militaires. Informations sur le lien familial requises.",
  },
  {
    id: "soutien",
    label: "Soutien",
    description:
      "Pour toute personne souhaitant soutenir la cause sans informations sur un parent militaire.",
  },
  {
    id: "benevole",
    label: "Bénévole",
    description: "Pour rejoindre l'équipe et contribuer activement aux actions de CFM.",
  },
];

// NAV_LINKS supprimé (mort) — Header et Footer déclarent leurs liens en propre.
