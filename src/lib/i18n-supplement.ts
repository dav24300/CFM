import type { Locale } from "@/lib/i18n";

export type Supplement = {
  common: {
    loading: string;
    discover: string;
    campaign: string;
    error: string;
    save: string;
    saving: string;
    donationsRecorded: string;
    totalUsd: string;
    totalCdf: string;
    select: string;
    logout: string;
    viewPetitions: string;
    profileUpdated: string;
    passwordMismatch: string;
    createAccountBtn: string;
  };
  footer: {
    tagline: string;
    quote: string;
    quickLinks: string;
    about: string;
    advocacy: string;
    engage: string;
    privacy: string;
    contact: string;
    newsletter: string;
    newsletterDesc: string;
    legal: string;
    privacyPolicy: string;
    copyright: string;
  };
  membershipTypes: Record<string, { label: string; description: string }>;
  axesContent: Record<string, { title: string; description: string; details: string[] }>;
  donateForm: {
    currency: string;
    providerLabel: string;
    donorName: string;
    donorEmail: string;
    processing: string;
    submitMobile: string;
    thanks: string;
  };
  forms: {
    firstName: string;
    lastName: string;
    phone: string;
    province: string;
    accountType: string;
    militaryLink: string;
    militaryName: string;
    skills: string;
    createMyAccount: string;
    familyLinks: string;
    myHelpRequests: string;
    myDonations: string;
    links: {
      conjoint: string;
      enfant: string;
      veuve: string;
      orphelin: string;
      parent: string;
    };
  };
  pages: {
    axes: { title: string; subtitle: string; heroAlt: string };
    actions: {
      title: string;
      subtitle: string;
      heroAlt: string;
      loading: string;
      empty: string;
      mapTitle: string;
      mapSubtitle: string;
      mapAria: string;
      allProvinces: string;
      types: Record<string, string>;
    };
    advocacy: {
      title: string;
      subtitle: string;
      heroAlt: string;
      studiesTitle: string;
      campaignsTitle: string;
      newsTitle: string;
      downloadPdf: string;
      ctaTitle: string;
      ctaBody: string;
      contactBtn: string;
    };
    press: {
      title: string;
      subtitle: string;
      pressKitTitle: string;
      pressKitDesc: string;
      downloadPdf: string;
      pressKitHint: string;
      contactPress: string;
      contactBtn: string;
      aboutCardTitle: string;
      aboutCardDesc: string;
      learnMore: string;
      releasesTitle: string;
      downloadRelease: string;
    };
    news: { back: string; fallbackTitle: string };
    memberArea: {
      loginTitle: string;
      loginSubtitle: string;
      registerTitle: string;
      registerSubtitle: string;
      profileTitle: string;
      profileBack: string;
      email: string;
      password: string;
      confirmPassword: string;
      loginBtn: string;
      loginLoading: string;
      forgotLink: string;
      noAccount: string;
      registerLink: string;
      hasAccount: string;
      loginLink: string;
      registerBtn: string;
      registerLoading: string;
      registerSuccess: string;
      editProfile: string;
      dashboardHello: string;
      accountActive: string;
      accountPending: string;
      pendingBanner: string;
      volunteerBanner: string;
      volunteerDashboard: string;
      noHelp: string;
      requestHelp: string;
      noDonations: string;
      donate: string;
    };
    engageExtra: {
      createAccount: string;
      signIn: string;
      quickSignupTitle: string;
      quickSignupDesc: string;
      transparencyTitle: string;
      transparencyBody: string;
      fundsTitle: string;
      fund1: string;
      fund2: string;
      fund3: string;
      fund4: string;
      annualReport: string;
      partnerTitle: string;
      partnerBody: string;
      partnerBtn: string;
      demoPayment: string;
      prodPayment: string;
    };
    legal: {
      mentionsTitle: string;
      privacyTitle: string;
      privacySubtitle: string;
    };
  };
};

const fr: Supplement = {
  common: {
    loading: "Chargement...",
    discover: "Découvrir",
    campaign: "Campagne",
    error: "Erreur",
    save: "Enregistrer",
    saving: "Enregistrement...",
    donationsRecorded: "Dons enregistrés",
    totalUsd: "Total USD (complétés)",
    totalCdf: "Total CDF (complétés)",
    select: "Sélectionner",
    logout: "Déconnexion",
    viewPetitions: "Voir les pétitions",
    profileUpdated: "Profil mis à jour.",
    passwordMismatch: "Les mots de passe ne correspondent pas",
    createAccountBtn: "Créer mon compte",
  },
  footer: {
    tagline: "Défendre les droits des dépendants des militaires",
    quote: "Derrière chaque militaire, il y a une famille.",
    quickLinks: "Liens rapides",
    about: "Qui sommes-nous",
    advocacy: "Plaidoyer & études",
    engage: "S'engager",
    privacy: "Confidentialité",
    contact: "Contact",
    newsletter: "Newsletter",
    newsletterDesc: "Restez informé de nos actions et campagnes.",
    legal: "Mentions légales",
    privacyPolicy: "Politique de confidentialité",
    copyright: "ASBL",
  },
  membershipTypes: {
    famille: {
      label: "Famille militaire",
      description:
        "Pour les conjoints, enfants, veuves et orphelins de militaires. Informations sur le lien familial requises.",
    },
    soutien: {
      label: "Soutien",
      description:
        "Pour toute personne souhaitant soutenir la cause sans informations sur un parent militaire.",
    },
    benevole: {
      label: "Bénévole",
      description: "Pour rejoindre l'équipe et contribuer activement aux actions de CFM.",
    },
  },
  axesContent: {
    social: {
      title: "Social",
      description:
        "Améliorer les conditions de vie des conjoints, veuves, orphelins et enfants de militaires.",
      details: [
        "Protection sociale renforcée",
        "Accompagnement des veuves et orphelins",
        "Soutien psychologique et communautaire",
        "Reconnaissance du sacrifice familial",
      ],
    },
    economique: {
      title: "Économique",
      description:
        "Autonomisation des femmes et veuves par l'entrepreneuriat et l'accès aux ressources économiques.",
      details: [
        "Formation à l'entrepreneuriat",
        "Microcrédit et accompagnement",
        "Réseau de femmes entrepreneures",
        "Plaidoyer pour l'accès équitable aux aides",
      ],
    },
    education: {
      title: "Éducation",
      description: "Garantir l'accès à l'éducation et à la formation pour les enfants de militaires.",
      details: [
        "Scolarisation des orphelins",
        "Bourses et soutien scolaire",
        "Formation professionnelle",
        "Plaidoyer pour des politiques éducatives inclusives",
      ],
    },
    environnement: {
      title: "Environnement",
      description:
        "Améliorer le cadre de vie dans et autour des camps et quartiers militaires.",
      details: [
        "Conditions d'habitat décentes",
        "Accès à l'eau et à l'assainissement",
        "Espaces verts et qualité de vie",
        "Développement durable des communautés militaires",
      ],
    },
    sante: {
      title: "Santé",
      description:
        "Santé sexuelle et reproductive des femmes dans les milieux des camps militaires.",
      details: [
        "Sensibilisation et prévention",
        "Accès aux soins de santé reproductive",
        "Plaidoyer pour des services adaptés",
        "Formation des agents de santé communautaires",
      ],
    },
  },
  donateForm: {
    currency: "Devise",
    providerLabel: "Opérateur Mobile Money",
    donorName: "Nom (optionnel)",
    donorEmail: "Email (reçu)",
    processing: "Traitement...",
    submitMobile: "Donner via Mobile Money",
    thanks: "Merci pour votre don !",
  },
  forms: {
    firstName: "Prénom",
    lastName: "Nom",
    phone: "Téléphone",
    province: "Province",
    accountType: "Type de compte",
    militaryLink: "Lien avec le militaire",
    militaryName: "Nom du militaire",
    skills: "Compétences",
    createMyAccount: "Créer mon compte",
    familyLinks: "Liens familiaux",
    myHelpRequests: "Mes demandes d'aide",
    myDonations: "Mes dons",
    links: {
      conjoint: "Conjoint(e)",
      enfant: "Enfant",
      veuve: "Veuve / Veuf",
      orphelin: "Orphelin",
      parent: "Parent",
    },
  },
  pages: {
    axes: {
      title: "Nos axes d'action",
      subtitle:
        "CFM propose des solutions pragmatiques pour améliorer de manière permanente le social, l'économie, l'environnement, l'éducation et la santé des dépendants des militaires.",
      heroAlt: "Axes d'action CFM",
    },
    actions: {
      title: "Actions nationales & régionales",
      subtitle: "Carte des actions de CFM à travers les 26 provinces de la RDC.",
      heroAlt: "Actions CFM en RDC",
      loading: "Chargement...",
      empty: "Aucune action enregistrée pour cette sélection.",
      mapTitle: "Carte des actions",
      mapSubtitle: "province(s) avec des actions — 26 provinces RDC",
      mapAria: "Carte stylisée de la RDC",
      allProvinces: "Toutes les provinces",
      types: {
        evenement: "Événement",
        atelier: "Atelier",
        plaidoyer: "Plaidoyer",
        action: "Action",
      },
    },
    advocacy: {
      title: "Plaidoyer & études",
      subtitle:
        "Nos analyses, conclusions et campagnes pour influencer les politiques nationales et internationales en faveur des familles militaires.",
      heroAlt: "Plaidoyer CFM",
      studiesTitle: "Études & rapports",
      campaignsTitle: "Campagnes",
      newsTitle: "Actualités & communiqués",
      downloadPdf: "Télécharger le rapport (PDF)",
      ctaTitle: "Vous êtes décideur ou institution ?",
      ctaBody: "Contactez notre équipe plaidoyer pour accéder à nos rapports complets.",
      contactBtn: "Nous contacter",
    },
    press: {
      title: "Espace presse",
      subtitle:
        "Ressources pour les journalistes et médias couvrant les droits des familles militaires en RDC.",
      pressKitTitle: "Dossier de presse",
      pressKitDesc: "Présentation de CFM, chiffres clés et visuels.",
      downloadPdf: "Télécharger le PDF",
      pressKitHint: "Déposez le fichier dans public/media/presse/dossier-presse.pdf",
      contactPress: "Contact presse",
      contactBtn: "Nous contacter",
      aboutCardTitle: "À propos",
      aboutCardDesc: "ASBL fondée en {year}, plaidoyer national et international.",
      learnMore: "En savoir plus",
      releasesTitle: "Communiqués de presse",
      downloadRelease: "Télécharger le communiqué (PDF)",
    },
    news: { back: "← Plaidoyer & actualités", fallbackTitle: "Actualité" },
    memberArea: {
      loginTitle: "Espace membre",
      loginSubtitle: "Connectez-vous à votre compte CFM",
      registerTitle: "Créer un compte",
      registerSubtitle:
        "Rejoignez la communauté CFM. Votre compte sera validé par l'équipe avant activation.",
      profileTitle: "Mon profil",
      profileBack: "← Mon espace",
      email: "Email",
      password: "Mot de passe",
      confirmPassword: "Confirmer le mot de passe",
      loginBtn: "Se connecter",
      loginLoading: "Connexion...",
      forgotLink: "Mot de passe oublié ?",
      noAccount: "Pas encore de compte ?",
      registerLink: "S'inscrire",
      hasAccount: "Déjà inscrit ?",
      loginLink: "Se connecter",
      registerBtn: "Créer mon compte",
      registerLoading: "Inscription...",
      registerSuccess:
        "Inscription réussie ! Votre compte sera activé après validation par l'équipe CFM.",
      editProfile: "Modifier mon profil",
      dashboardHello: "Bonjour",
      accountActive: "Compte actif",
      accountPending: "En attente de validation",
      pendingBanner: "Votre compte est en attente de validation par l'équipe CFM.",
      volunteerBanner: "Espace bénévole : accédez au tableau de bord limité.",
      volunteerDashboard: "Dashboard bénévole",
      noHelp: "Aucune demande.",
      requestHelp: "Faire une demande",
      noDonations: "Aucun don.",
      donate: "Faire un don",
    },
    engageExtra: {
      createAccount: "Créer un compte",
      signIn: "Se connecter",
      quickSignupTitle: "Pré-inscription rapide (sans compte)",
      quickSignupDesc: "Alternative sans mot de passe — validée manuellement par l'équipe CFM.",
      transparencyTitle: "Transparence financière",
      transparencyBody:
        "CFM s'engage à une transparence totale envers ses donateurs. Chaque contribution est utilisée pour nos actions de plaidoyer, d'études et d'accompagnement direct des familles militaires.",
      fundsTitle: "Utilisation des fonds",
      fund1: "Études et rapports de plaidoyer",
      fund2: "Campagnes d'autonomisation des femmes et veuves",
      fund3: "Accompagnement des familles en situation de vulnérabilité",
      fund4: "Actions sur le terrain dans les provinces",
      annualReport: "Rapport annuel disponible sur demande auprès de l'équipe administrative.",
      partnerTitle: "Devenir partenaire",
      partnerBody: "Institutions, ONG et entreprises : contactez-nous pour explorer un partenariat avec CFM.",
      partnerBtn: "Proposer un partenariat",
      demoPayment:
        "Mode démo : paiement simulé. Configurez MOBILE_MONEY_MODE=production et PayDunya pour la production.",
      prodPayment: "Paiement sécurisé via PayDunya (Orange Money, M-Pesa, Airtel).",
    },
    legal: {
      mentionsTitle: "Mentions légales",
      privacyTitle: "Politique de confidentialité",
      privacySubtitle: "Protection de vos données personnelles",
    },
  },
};

const en: Supplement = {
  common: {
    loading: "Loading...",
    discover: "Discover",
    campaign: "Campaign",
    error: "Error",
    save: "Save",
    saving: "Saving...",
    donationsRecorded: "Donations recorded",
    totalUsd: "Total USD (completed)",
    totalCdf: "Total CDF (completed)",
    select: "Select",
    logout: "Log out",
    viewPetitions: "View petitions",
    profileUpdated: "Profile updated.",
    passwordMismatch: "Passwords do not match",
    createAccountBtn: "Create my account",
  },
  footer: {
    tagline: "Defending the rights of military dependents",
    quote: "Behind every soldier stands a family.",
    quickLinks: "Quick links",
    about: "About us",
    advocacy: "Advocacy & studies",
    engage: "Get involved",
    privacy: "Privacy",
    contact: "Contact",
    newsletter: "Newsletter",
    newsletterDesc: "Stay informed about our actions and campaigns.",
    legal: "Legal notice",
    privacyPolicy: "Privacy policy",
    copyright: "Non-profit",
  },
  membershipTypes: {
    famille: {
      label: "Military family",
      description:
        "For spouses, children, widows and orphans of military personnel. Family link information required.",
    },
    soutien: {
      label: "Supporter",
      description: "For anyone wishing to support the cause without military family information.",
    },
    benevole: {
      label: "Volunteer",
      description: "To join the team and actively contribute to CFM's actions.",
    },
  },
  axesContent: {
    social: {
      title: "Social",
      description:
        "Improving living conditions for spouses, widows, orphans and children of military personnel.",
      details: [
        "Strengthened social protection",
        "Support for widows and orphans",
        "Psychological and community support",
        "Recognition of family sacrifice",
      ],
    },
    economique: {
      title: "Economic",
      description: "Empowering women and widows through entrepreneurship and economic resources.",
      details: [
        "Entrepreneurship training",
        "Microcredit and mentoring",
        "Women entrepreneurs network",
        "Advocacy for fair access to aid",
      ],
    },
    education: {
      title: "Education",
      description: "Ensuring access to education and training for children of military personnel.",
      details: [
        "Schooling for orphans",
        "Scholarships and academic support",
        "Vocational training",
        "Advocacy for inclusive education policies",
      ],
    },
    environnement: {
      title: "Environment",
      description: "Improving living conditions in and around military camps and quarters.",
      details: [
        "Decent housing conditions",
        "Access to water and sanitation",
        "Green spaces and quality of life",
        "Sustainable development of military communities",
      ],
    },
    sante: {
      title: "Health",
      description: "Sexual and reproductive health of women in military camp environments.",
      details: [
        "Awareness and prevention",
        "Access to reproductive healthcare",
        "Advocacy for adapted services",
        "Community health worker training",
      ],
    },
  },
  donateForm: {
    currency: "Currency",
    providerLabel: "Mobile Money provider",
    donorName: "Name (optional)",
    donorEmail: "Email (receipt)",
    processing: "Processing...",
    submitMobile: "Donate via Mobile Money",
    thanks: "Thank you for your donation!",
  },
  forms: {
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    province: "Province",
    accountType: "Account type",
    militaryLink: "Link to military member",
    militaryName: "Military member's name",
    skills: "Skills",
    createMyAccount: "Create my account",
    familyLinks: "Family links",
    myHelpRequests: "My help requests",
    myDonations: "My donations",
    links: {
      conjoint: "Spouse",
      enfant: "Child",
      veuve: "Widow / Widower",
      orphelin: "Orphan",
      parent: "Parent",
    },
  },
  pages: {
    axes: {
      title: "Our focus areas",
      subtitle:
        "CFM offers pragmatic solutions to permanently improve social, economic, environmental, educational and health outcomes for military dependents.",
      heroAlt: "CFM focus areas",
    },
    actions: {
      title: "National & regional actions",
      subtitle: "Map of CFM actions across the 26 provinces of DRC.",
      heroAlt: "CFM actions in DRC",
      loading: "Loading...",
      empty: "No actions recorded for this selection.",
      mapTitle: "Actions map",
      mapSubtitle: "province(s) with recorded actions — 26 DRC provinces",
      mapAria: "Stylised map of DRC",
      allProvinces: "All provinces",
      types: { evenement: "Event", atelier: "Workshop", plaidoyer: "Advocacy", action: "Action" },
    },
    advocacy: {
      title: "Advocacy & studies",
      subtitle:
        "Our analyses, conclusions and campaigns to influence national and international policy for military families.",
      heroAlt: "CFM advocacy",
      studiesTitle: "Studies & reports",
      campaignsTitle: "Campaigns",
      newsTitle: "News & press releases",
      downloadPdf: "Download report (PDF)",
      ctaTitle: "Are you a decision-maker or institution?",
      ctaBody: "Contact our advocacy team for full reports.",
      contactBtn: "Contact us",
    },
    press: {
      title: "Press room",
      subtitle: "Resources for journalists covering military families' rights in DRC.",
      pressKitTitle: "Press kit",
      pressKitDesc: "CFM overview, key figures and visuals.",
      downloadPdf: "Download PDF",
      pressKitHint: "Place file at public/media/presse/dossier-presse.pdf",
      contactPress: "Press contact",
      contactBtn: "Contact us",
      aboutCardTitle: "About",
      aboutCardDesc: "Non-profit founded in {year}, national and international advocacy.",
      learnMore: "Learn more",
      releasesTitle: "Press releases",
      downloadRelease: "Download release (PDF)",
    },
    news: { back: "← Advocacy & news", fallbackTitle: "News" },
    memberArea: {
      loginTitle: "Member area",
      loginSubtitle: "Sign in to your CFM account",
      registerTitle: "Create an account",
      registerSubtitle: "Join the CFM community. Your account will be reviewed before activation.",
      profileTitle: "My profile",
      profileBack: "← My account",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm password",
      loginBtn: "Sign in",
      loginLoading: "Signing in...",
      forgotLink: "Forgot password?",
      noAccount: "No account yet?",
      registerLink: "Register",
      hasAccount: "Already registered?",
      loginLink: "Sign in",
      registerBtn: "Create my account",
      registerLoading: "Registering...",
      registerSuccess: "Registration successful! Your account will be activated after review.",
      editProfile: "Edit my profile",
      dashboardHello: "Hello",
      accountActive: "Active account",
      accountPending: "Pending approval",
      pendingBanner: "Your account is pending approval by the CFM team.",
      volunteerBanner: "Volunteer area: access the limited dashboard.",
      volunteerDashboard: "Volunteer dashboard",
      noHelp: "No requests.",
      requestHelp: "Request help",
      noDonations: "No donations.",
      donate: "Make a donation",
    },
    engageExtra: {
      createAccount: "Create account",
      signIn: "Sign in",
      quickSignupTitle: "Quick pre-registration (no account)",
      quickSignupDesc: "Password-free alternative — manually validated by CFM team.",
      transparencyTitle: "Financial transparency",
      transparencyBody:
        "CFM is committed to full transparency with donors. Every contribution supports advocacy, studies and direct family support.",
      fundsTitle: "Use of funds",
      fund1: "Advocacy studies and reports",
      fund2: "Women and widows empowerment campaigns",
      fund3: "Support for vulnerable families",
      fund4: "Field actions in provinces",
      annualReport: "Annual report available on request from the admin team.",
      partnerTitle: "Become a partner",
      partnerBody: "Institutions, NGOs and companies: contact us to explore a partnership.",
      partnerBtn: "Propose a partnership",
      demoPayment:
        "Demo mode: simulated payment. Set MOBILE_MONEY_MODE=production and PayDunya for production.",
      prodPayment: "Secure payment via PayDunya (Orange Money, M-Pesa, Airtel).",
    },
    legal: {
      mentionsTitle: "Legal notice",
      privacyTitle: "Privacy policy",
      privacySubtitle: "Protection of your personal data",
    },
  },
};

const ln: Supplement = {
  ...fr,
  common: {
    ...fr.common,
    loading: "Ezali kozela...",
    discover: "Tala",
    save: "Kobomba",
    saving: "Ezali kobomba...",
    logout: "Kobima",
    viewPetitions: "Tala ba pétitions",
  },
  footer: {
    ...fr.footer,
    quickLinks: "Ba liens",
    about: "Biso nde bani",
    advocacy: "Plaidoyer",
    engage: "Kosala elongo",
    newsletterDesc: "Bozwa ba sango na biso.",
  },
  pages: {
    ...fr.pages,
    axes: {
      title: "Bisika ya misala",
      subtitle: "CFM epesaka ba solutions mpo na kobongisa social, économie, environnement, éducation mpe santé.",
      heroAlt: "Bisika ya misala CFM",
    },
    actions: {
      ...fr.pages.actions,
      title: "Misala na mboka mpe na bitúká",
      subtitle: "Carte ya misala na CFM na 26 provinces.",
      loading: "Ezali kozela...",
      empty: "Misala ezali te mpo na sélection oyo.",
      allProvinces: "Ba provinces nionso",
    },
    advocacy: {
      ...fr.pages.advocacy,
      title: "Plaidoyer & ba études",
      studiesTitle: "Ba études & rapports",
      campaignsTitle: "Ba campagnes",
      newsTitle: "Ba actualités",
    },
    press: { ...fr.pages.press, title: "Espace presse", releasesTitle: "Ba communiqués" },
    memberArea: {
      ...fr.pages.memberArea,
      loginTitle: "Esika ya membres",
      loginSubtitle: "Kota na compte na yo",
      registerTitle: "Komikoma",
      profileTitle: "Profil na ngai",
      loginBtn: "Kokota",
      registerBtn: "Komikoma",
      dashboardHello: "Mbote",
    },
    engageExtra: {
      ...fr.pages.engageExtra,
      createAccount: "Komikoma",
      signIn: "Kokota",
    },
    legal: {
      mentionsTitle: "Mentions légales",
      privacyTitle: "Politique ya confidentialité",
      privacySubtitle: "Bokengi ya ba données na yo",
    },
  },
};

const sw: Supplement = {
  ...en,
  common: {
    ...en.common,
    loading: "Inapakia...",
    discover: "Gundua",
    save: "Hifadhi",
    saving: "Inahifadhi...",
    logout: "Ondoka",
    viewPetitions: "Angalia petisheni",
  },
  footer: {
    ...en.footer,
    quickLinks: "Viungo vya haraka",
    about: "Sisi ni nani",
    advocacy: "Utetezi",
    engage: "Shiriki",
    newsletterDesc: "Pokea habari zetu.",
    legal: "Notisi ya kisheria",
    privacyPolicy: "Sera ya faragha",
  },
  pages: {
    ...en.pages,
    axes: {
      title: "Maeneo yetu",
      subtitle: "CFM inatoa suluhisho za kuboresha hali ya kijamii, kiuchumi, mazingira, elimu na afya.",
      heroAlt: "Maeneo ya CFM",
    },
    actions: {
      ...en.pages.actions,
      title: "Vitendo vya kitaifa na mikoa",
      subtitle: "Ramani ya vitendo vya CFM katika wilaya 26.",
      loading: "Inapakia...",
      empty: "Hakuna vitendo kwa chaguo hili.",
      allProvinces: "Wilaya zote",
    },
    advocacy: {
      ...en.pages.advocacy,
      title: "Utetezi na masomo",
      studiesTitle: "Masomo na ripoti",
      campaignsTitle: "Kampeni",
      newsTitle: "Habari",
    },
    press: { ...en.pages.press, title: "Chumba cha habari", releasesTitle: "Taarifa kwa vyombo vya habari" },
    memberArea: {
      ...en.pages.memberArea,
      loginTitle: "Eneo la wanachama",
      loginSubtitle: "Ingia kwenye akaunti yako",
      registerTitle: "Jisajili",
      profileTitle: "Wasifu wangu",
      loginBtn: "Ingia",
      registerBtn: "Jisajili",
      dashboardHello: "Habari",
    },
    engageExtra: {
      ...en.pages.engageExtra,
      createAccount: "Fungua akaunti",
      signIn: "Ingia",
    },
    legal: {
      mentionsTitle: "Notisi ya kisheria",
      privacyTitle: "Sera ya faragha",
      privacySubtitle: "Ulinzi wa data zako binafsi",
    },
  },
};

export const supplement: Record<Locale, Supplement> = { fr, en, ln, sw };

function deepMerge<T extends Record<string, unknown>>(base: T, extra: T): T {
  const out = { ...base };
  for (const key of Object.keys(extra)) {
    const b = base[key];
    const o = extra[key];
    if (
      b &&
      o &&
      typeof b === "object" &&
      typeof o === "object" &&
      !Array.isArray(b) &&
      !Array.isArray(o)
    ) {
      out[key as keyof T] = deepMerge(
        b as Record<string, unknown>,
        o as Record<string, unknown>
      ) as T[keyof T];
    } else {
      out[key as keyof T] = o as T[keyof T];
    }
  }
  return out;
}

export function mergeSupplement<T extends Record<string, unknown>>(base: T, locale: Locale): T {
  return deepMerge(base, supplement[locale] as unknown as T);
}

export function dateLocale(locale: Locale): string {
  if (locale === "en") return "en-US";
  if (locale === "sw") return "sw-KE";
  return "fr-FR";
}
