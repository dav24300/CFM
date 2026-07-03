# Plan de conception — CFM ASBL (Cri de Familles Militaires)

## 1. Identité du projet

| Élément | Détail |
|---------|--------|
| **Nom** | Cri de Familles Militaires |
| **Sigle** | CFM |
| **Pays** | République Démocratique du Congo (RDC) |
| **Statut** | ASBL |
| **Fondation** | 2018 — Ngonga Mbana Glody |
| **Moment fondateur** | Rassemblement des familles de militaires à la FIKIN 2025 |
| **Mission** | Défendre les droits des dépendants des militaires |
| **Domaine cible** | cfmasbl.com / cfm-asbl.org |
| **Ambiance** | Chaleureuse, familiale |

### Message central

> *« Le vrai visage de la guerre sous toutes ses formes se retrouve dans le quotidien des personnes que vous avez décidé d'approcher. »*

### Positionnement unique

Le fondateur, fils de militaires des deux côtés, a grandi dans le système militaire. CFM analyse les faiblesses sociales et sectorielles, produit des études aboutissant à des conclusions de nécessité nationale, et transforme un souci communautaire en levier de développement social, économique et de cohésion nationale.

---

## 2. Publics et langues

- **Publics** : familles militaires, décideurs, médias, bénévoles, partenaires, grand public
- **Langues V1** : français uniquement
- **Langues V2/V3** : anglais, langues nationales (Lingala, Swahili…)
- **Accessibilité** : contrastes, navigation claire, mobile-first

---

## 3. Axes thématiques

1. **Social** — conditions de vie des dépendants
2. **Économique** — autonomisation des femmes et veuves par l'entrepreneuriat
3. **Éducation** — scolarisation, formation des orphelins
4. **Environnement** — cadre de vie dans et autour des camps
5. **Santé** — santé sexuelle des femmes dans les milieux des camps militaires

---

## 4. Architecture en 3 phases

```
V1 (Lancement)     → Site public + CMS admin + formulaires sécurisés
V2 (Communauté)  → Espace membres + lien parent/enfant + Mobile Money + pétitions
V3 (Mobilisation)→ Live natif + notifications push + multilingue complet
```

---

## 5. V1 — Périmètre livré

### 5.1 Pages publiques

| Page | Contenu |
|------|---------|
| **Accueil** | Hero, mission, axes, campagnes, CTA aide/don/adhésion |
| **Qui sommes-nous** | Histoire, fondateur, FIKIN 2025, gouvernance |
| **Nos axes** | 5 thématiques détaillées |
| **Plaidoyer & études** | Rapports, conclusions, campagnes |
| **Actions** | Carte nationale et régionale (26 provinces RDC) |
| **S'engager** | Adhésion (3 types), don, partenariat |
| **Espace presse** | Dossier, communiqués, contacts |
| **Contact & aide** | Formulaire confidentiel |
| **Légal** | Mentions légales, politique de confidentialité |

### 5.2 Fonctionnalités V1

- Site responsive mobile-first
- Dashboard admin (`/admin`) pour 1 bénévole
- Gestion : actualités, études, campagnes, partenaires, témoignages
- 3 types d'adhésion : famille militaire / soutien / bénévole
- Formulaire d'aide confidentiel (données chiffrées au repos)
- Espace presse avec téléchargements
- Transparence donateurs
- Intégration réseaux sociaux (liens + embed live YouTube/Facebook)
- Carte interactive des actions par province
- Newsletter (inscription stockée)
- Modération : pas de commentaires publics en V1
- Protection mineurs : champ âge, consentement parental

### 5.3 Reporté V2/V3

| Fonctionnalité | Phase |
|----------------|-------|
| Compte membre + lien parent ↔ enfant | V2 |
| Paiement Mobile Money (Orange, M-Pesa, Airtel) | V2 |
| Pétitions avancées avec suivi | V2 |
| Live stream natif + chat | V3 |
| Notifications push | V3 |
| Multilingue (EN + national) | V2–V3 |

---

## 6. Stack technique V1

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Styles | Tailwind CSS |
| Données | Fichier JSON (`data/store.json`) |
| Auth admin | Session par mot de passe (env) |
| Hébergement cible | VPS + Cloudflare CDN |
| Live V1 | Embed YouTube / Facebook |

---

## 7. Sécurité

- HTTPS obligatoire en production
- Politique de confidentialité intégrée
- Données sensibles : accès admin restreint
- Formulaires mineurs : validation âge + consentement parental
- Sauvegardes base de données recommandées (hebdomadaire)
- Variables sensibles via `.env.local`

---

## 8. Modèle d'adhésion

| Type | Infos V1 | V2 |
|------|----------|-----|
| Famille militaire | Identité, lien au militaire, province | Compte + lien parent/enfant |
| Soutien | Nom, contact — sans info parent militaire | Newsletter + don |
| Bénévole | Compétences, disponibilité | Accès dashboard limité |

---

## 9. Campagnes prioritaires

1. Autonomisation des femmes et veuves par l'entrepreneuriat
2. Santé sexuelle des femmes dans les camps militaires
3. Plaidoyer national et international

---

## 10. Indicateurs de succès (12 mois)

| Objectif | Cible V1 |
|----------|----------|
| Visites/mois | 500–2 000 |
| Newsletter | 200+ inscrits |
| Demandes d'aide | Réponse sous 7 jours |
| Pré-inscriptions familles | 50+ |
| Contacts presse | 5+ médias |

---

## 11. Calendrier

| Phase | Durée | Livrable |
|-------|-------|----------|
| Cadrage & contenu | S1–S2 | Textes, photos, arborescence |
| Design UI | S3–S4 | Maquettes |
| Développement V1 | S5–S10 | Site + admin |
| Tests | S11–S12 | Mobile 3G, accessibilité |
| Lancement | Mars 2026 | cfmasbl.com |

---

## 12. Budget

| Poste | Coût annuel estimé |
|-------|-------------------|
| Domaine .com | ~12–15 USD |
| Hébergement VPS | ~30–50 USD |
| SSL | Gratuit (Let's Encrypt) |
| **Total infra V1** | **~60 USD/an** |

---

## 13. Structure du dépôt

```
CFM/
├── PLAN.md
├── README.md
├── src/
│   ├── app/           # Pages Next.js
│   ├── components/    # Composants UI
│   └── lib/           # DB, auth, contenu
├── data/              # store.json (données persistantes)
└── public/            # Assets statiques
```

---

*Document généré pour CFM ASBL — V1 en cours d'implémentation.*

---

## 14. V1 — Étapes réalisées et validées

| # | Étape | Livrable | Statut | Validation |
|---|-------|----------|--------|------------|
| 1 | Cadrage & arborescence | `PLAN.md`, structure du dépôt | ✅ Réalisé | Document validé |
| 2 | Scaffold technique | Next.js 15, Tailwind CSS, TypeScript | ✅ Réalisé | `npm run build` OK |
| 3 | Identité & constantes | Nom, mission, axes, 26 provinces RDC | ✅ Réalisé | Contenu présent sur le site |
| 4 | Page Accueil | Hero, mission, axes, campagnes, témoignages, CTA, live embed | ✅ Réalisé | HTTP 200, contenu FIKIN 2025 vérifié |
| 5 | Page Qui sommes-nous | Histoire, fondateur, FIKIN 2025, gouvernance | ✅ Réalisé | HTTP 200 |
| 6 | Page Nos axes | 5 thématiques détaillées | ✅ Réalisé | HTTP 200, axe Santé vérifié |
| 7 | Page Plaidoyer & études | Rapports, campagnes, actualités, lien pétition externe | ✅ Réalisé | HTTP 200, campagnes affichées |
| 8 | Page Actions | Carte/liste par province (26 provinces RDC) | ✅ Réalisé | HTTP 200, API 3 actions |
| 9 | Page S'engager | 3 types d'adhésion, don, transparence, partenariat | ✅ Réalisé | HTTP 200 |
| 10 | Page Presse | Communiqués, contacts presse | ✅ Réalisé | HTTP 200 |
| 11 | Page Contact & aide | Formulaire confidentiel + contact général | ✅ Réalisé | HTTP 200, soumissions OK |
| 12 | Pages légales | Mentions légales, politique de confidentialité | ✅ Réalisé | HTTP 200 |
| 13 | Header & Footer | Navigation, réseaux sociaux, newsletter | ✅ Réalisé | Liens et formulaire fonctionnels |
| 14 | Formulaire adhésion | Famille / Soutien / Bénévole (pré-inscription) | ✅ Réalisé | API OK, validation lien militaire |
| 15 | Formulaire aide confidentielle | Protection mineurs, consentement parental | ✅ Réalisé | API OK, rejet mineur sans consentement |
| 16 | Formulaire contact | Messages généraux et presse | ✅ Réalisé | API OK |
| 17 | Newsletter | Inscription email, anti-doublon | ✅ Réalisé | API OK, doublon rejeté (409) |
| 18 | Persistance données | `data/store.json` | ✅ Réalisé | Fichier créé et mis à jour |
| 19 | Dashboard admin | Connexion `/admin`, tableau de bord `/admin/dashboard` | ✅ Réalisé | Login OK, stats cohérentes |
| 20 | Gestion admin | Actualités, témoignages, actions, adhésions, aide, newsletter | ✅ Réalisé | CRUD et changement de statut OK |
| 21 | Sécurité admin | Session cookie, API protégée (401 sans auth) | ✅ Réalisé | Test non autorisé OK |
| 22 | Contenu de démonstration | News, études, campagnes, témoignages, actions, presse | ✅ Réalisé | Données seed affichées |
| 23 | Build production | Compilation sans erreur | ✅ Réalisé | `npm run build` OK |
| 24 | Tests parcours | Pages, API, formulaires, admin | ✅ Validé | Juin 2026 — parcours automatisé OK |

### Synthèse V1

| Indicateur | Résultat |
|------------|----------|
| Pages publiques | 10/10 opérationnelles |
| Routes API | 8/8 fonctionnelles |
| Validations métier | 3/3 conformes |
| Admin | Connexion + dashboard opérationnels |
| Persistance | `data/store.json` actif |

---

## 15. Plan V2 — Communauté (sans implémentation)

### 15.1 Objectifs V2

| Objectif | Description |
|----------|-------------|
| **Espace membre** | Comptes personnels pour familles, soutiens et bénévoles validés |
| **Lien familial** | Parent ↔ enfant, membres à charge, vérification d'identité |
| **Mobilisation** | Pétitions intégrées avec suivi des signatures |
| **Financement** | Dons en ligne via Mobile Money (Orange, M-Pesa, Airtel) |
| **Multilingue (début)** | Anglais en priorité, préparation Lingala / Swahili |
| **Bénévoles** | Rôles limités dans le dashboard (modération, suivi dossiers) |

### 15.2 Périmètre fonctionnel V2

| Module | Fonctionnalités prévues | Priorité |
|--------|-------------------------|----------|
| **Authentification membres** | Inscription, connexion, mot de passe oublié, validation manuelle admin | Haute |
| **Profil membre** | Informations personnelles, province, type d'adhésion, statut | Haute |
| **Lien parent / enfant** | Parent ajoute enfants à charge ; enfant identifie son parent ; validation croisée | Haute |
| **Adhésion soutien** | Sans info parent militaire (comme V1, mais avec compte actif) | Haute |
| **Espace privé famille** | Documents, historique demandes d'aide, statut des dossiers | Haute |
| **Pétitions** | Création admin, signature en ligne, compteur, export CSV | Moyenne |
| **Mobile Money** | Intégration PayDunya / Flutterwave — Orange Money, M-Pesa, Airtel | Haute |
| **Reçus donateurs** | Confirmation email, historique dans espace membre / admin | Moyenne |
| **Notifications email** | Confirmation adhésion, réponse aide, campagnes | Moyenne |
| **Anglais** | Interface bilingue FR/EN (contenu prioritaire) | Moyenne |
| **Rôles bénévoles** | Accès restreint : aide, adhésions, pas de suppression contenu | Basse |

### 15.3 Parcours utilisateurs V2

| Profil | Parcours |
|--------|----------|
| **Parent militaire** | Adhésion V1 validée → activation compte → ajout enfants à charge → suivi dossiers |
| **Enfant / orphelin** | Adhésion → identification du parent → validation par parent ou admin |
| **Veuve / conjoint** | Compte → accès campagnes entrepreneuriat → demandes d'aide suivies |
| **Soutien** | Compte simple → newsletter → don Mobile Money → pétitions |
| **Bénévole** | Compte → dashboard limité → traitement adhésions / demandes d'aide |
| **Admin** | Validation comptes, liens familiaux, rapports dons, gestion pétitions |

### 15.4 Modèle de données V2 (évolution)

| Entité | Champs / relations nouveaux |
|--------|----------------------------|
| **users** | email, password_hash, role, membership_type, status, verified_at |
| **family_links** | parent_user_id, child_user_id, relationship, status (pending/approved) |
| **donations** | user_id, amount, currency, provider, transaction_id, status |
| **petitions** | title, slug, goal, signatures_count, active |
| **petition_signatures** | petition_id, user_id ou email, signed_at |
| **help_request_updates** | help_request_id, status, note, updated_by, date |

### 15.5 Stack technique V2 (recommandée)

| Couche | Évolution par rapport à V1 |
|--------|----------------------------|
| **Base de données** | Migration `store.json` → PostgreSQL ou SQLite (serveur Linux) |
| **Auth membres** | NextAuth.js ou sessions JWT sécurisées |
| **Paiements** | API PayDunya / Flutterwave (webhooks) |
| **Emails** | Resend, Brevo ou SMTP Zoho |
| **i18n** | next-intl (FR + EN) |
| **Fichiers** | Stockage uploads (photos, rapports PDF) sur VPS ou S3 |

### 15.6 Sécurité V2

| Mesure | Détail |
|--------|--------|
| Mots de passe | Hash bcrypt, politique de complexité |
| Liens familiaux | Validation admin ou confirmation croisée parent/enfant |
| Données sensibles | Chiffrement au repos, logs d'accès admin |
| Paiements | Webhooks signés, aucune donnée carte stockée |
| Mineurs | Consentement parental obligatoire, accès restreint |
| RGPD / RDC | Politique mise à jour, droit à l'effacement |

### 15.7 Calendrier V2 proposé

| Phase | Durée estimée | Livrable |
|-------|---------------|----------|
| Conception détaillée | 2 semaines | Cahier des charges V2, maquettes espace membre |
| Migration données | 1 semaine | PostgreSQL + script import `store.json` |
| Auth & profils | 3 semaines | Inscription, connexion, validation admin |
| Lien parent/enfant | 2 semaines | Workflow complet + tests |
| Mobile Money | 2 semaines | Dons en ligne + reçus |
| Pétitions | 1 semaine | Module intégré |
| Anglais | 2 semaines | Interface + contenus prioritaires |
| Tests & sécurité | 2 semaines | Tests RDC (3G), audit données sensibles |
| Lancement V2 | — | cfmasbl.com — espace membre actif |

**Durée totale estimée : 3 à 4 mois**

### 15.8 Budget V2 estimé

| Poste | Coût estimé |
|-------|-------------|
| Infra V1 (domaine + VPS) | ~60 USD/an (inchangé) |
| Passerelle paiement | Commission par transaction (2–4 %) |
| Emails transactionnels | Gratuit–20 USD/mois (Brevo/Resend) |
| Développement | Bénévolat ou budget à définir |
| **Total infra additionnel** | **~0–100 USD/an** (hors commissions) |

### 15.9 Critères de validation V2

| Critère | Cible |
|---------|-------|
| Comptes membres activés | 50+ familles |
| Liens parent/enfant validés | 20+ |
| Dons Mobile Money | Première transaction réussie |
| Pétition | 1 campagne avec 100+ signatures |
| Anglais | 80 % des pages principales traduites |
| Temps de réponse aide | < 7 jours (inchangé) |

### 15.10 Reporté V3 (rappel)

| Fonctionnalité | Phase |
|----------------|-------|
| Live stream natif + chat intégré | V3 |
| Notifications push (PWA) | V3 |
| Multilingue complet (Lingala, Swahili) | V3 |
| Application mobile | V3 (optionnel) |

---

*Mise à jour : juin 2026 — V1 réalisée et validée ; plan V2 défini, implémentation à venir.*

---

## 16. V2 — Étapes réalisées et validées

| # | Étape | Livrable | Statut | Validation |
|---|-------|----------|--------|------------|
| 1 | Modèle de données V2 | `users`, `family_links`, `donations`, `petitions`, `petition_signatures`, `help_request_updates` dans `store.json` | ✅ Réalisé | Migration auto au chargement |
| 2 | Auth membres | Inscription, connexion, déconnexion, sessions sécurisées | ✅ Réalisé | API `/api/member/*` OK |
| 3 | Hash mots de passe | `bcryptjs` (min. 8 caractères) | ✅ Réalisé | Stockage `password_hash` |
| 4 | Types de compte | Famille militaire / Soutien / Bénévole | ✅ Réalisé | 3 types à l'inscription |
| 5 | Validation admin comptes | Statut `pending` → `active` | ✅ Réalisé | Onglet V2 admin |
| 6 | Page inscription | `/membre/inscription` | ✅ Réalisé | HTTP 200, API testée |
| 7 | Page connexion | `/membre/connexion` | ✅ Réalisé | HTTP 200 |
| 8 | Tableau de bord membre | `/membre/tableau-de-bord` | ✅ Réalisé | Comptes pending + actifs |
| 9 | Lien parent → enfant | Invitation par email, statut `pending_child` | ✅ Réalisé | API `/api/member/family` |
| 10 | Lien enfant → parent | Demande par email, statut `pending_parent` | ✅ Réalisé | Approbation croisée |
| 11 | Validation liens familiaux | Approuver / refuser + validation admin | ✅ Réalisé | Workflow complet |
| 12 | Module pétitions public | `/petitions`, `/petitions/[slug]` | ✅ Réalisé | 2 pétitions seed |
| 13 | Signature pétition | Formulaire + anti-doublon email | ✅ Réalisé | API testée |
| 14 | Compteur signatures | Barre de progression, objectif | ✅ Réalisé | Affichage public |
| 15 | Dons Mobile Money | Orange / M-Pesa / Airtel | ✅ Réalisé | Mode démo + stub production |
| 16 | Historique dons membre | Section dans tableau de bord | ✅ Réalisé | Lié au `user_id` |
| 17 | Suivi demandes d'aide | Historique + mises à jour admin | ✅ Réalisé | `help_request_updates` |
| 18 | Multilingue FR/EN | Sélecteur header, navigation traduite | ✅ Réalisé | Cookie `cfm_locale` |
| 19 | Dashboard admin V2 | Onglet « V2 Communauté » | ✅ Réalisé | Membres, liens, dons, pétitions |
| 20 | Rôles bénévoles | Accès limité admin (aide, adhésions, V2) | ✅ Réalisé | Pas de gestion contenu |
| 21 | Création pétitions admin | Formulaire dans dashboard | ✅ Réalisé | Admin uniquement |
| 22 | Intégration plaidoyer | Lien vers `/petitions` depuis campagnes | ✅ Réalisé | Page plaidoyer |
| 23 | Build production | Compilation sans erreur | ✅ Réalisé | `npm run build` OK |
| 24 | Tests parcours V2 | Inscription, pétition, don, signature | ✅ Validé | Juin 2026 — APIs OK |

### Synthèse V2

| Indicateur | Résultat |
|------------|----------|
| Pages membre | 3/3 opérationnelles |
| Routes API V2 | 8/8 fonctionnelles |
| Pétitions actives | 2 (seed) |
| Mobile Money | Mode démo actif |
| Langues interface | FR + EN (navigation) |
| Admin V2 | Onglet dédié opérationnel |

### Reporté post-V2 (améliorations futures)

| Fonctionnalité | Statut |
|----------------|--------|
| Mot de passe oublié | ⏳ Non implémenté |
| Notifications email (adhésion, aide, dons) | ⏳ Non implémenté |
| Reçus donateurs par email | ⏳ Non implémenté |
| Export CSV pétitions | ⏳ Non implémenté |
| Migration PostgreSQL | ⏳ `store.json` conservé |
| Contenu pages en anglais (80 %) | ⏳ Navigation seulement |
| PayDunya / Flutterwave production | ⏳ Variables `.env` prêtes |

---

## 17. Plan V3 — Mobilisation (sans implémentation)

### 17.1 Objectifs V3

| Objectif | Description |
|----------|-------------|
| **Live stream natif** | Diffusion en direct sur le site avec chat intégré |
| **Notifications push** | Alertes campagnes, lives, réponses aux dossiers (PWA) |
| **Multilingue complet** | Lingala, Swahili + contenu traduit (pas seulement la navigation) |
| **Engagement temps réel** | Interactions live, sondages, Q&R pendant les événements |
| **Accessibilité renforcée** | Optimisation 3G RDC, mode hors-ligne partiel |
| **Application mobile** | PWA installable ou app native (optionnel) |

### 17.2 Périmètre fonctionnel V3

| Module | Fonctionnalités prévues | Priorité |
|--------|-------------------------|----------|
| **Live stream** | Player intégré, chat modéré, replay, embed fallback YouTube/Facebook | Haute |
| **Chat live** | Messages temps réel, modération, anti-spam, protection mineurs | Haute |
| **Notifications push** | Service Worker PWA, abonnement par thème (campagnes, aide, lives) | Haute |
| **Lingala** | Interface + pages principales + formulaires | Haute |
| **Swahili** | Interface + pages principales + formulaires | Haute |
| **PWA** | Installable, icône, splash, cache pages clés | Moyenne |
| **Sondages live** | Votes en direct pendant événements CFM | Moyenne |
| **Migration BDD** | PostgreSQL sur VPS Linux, script import `store.json` | Moyenne |
| **Emails transactionnels** | Finaliser V2 reporté : adhésion, aide, dons, campagnes | Moyenne |
| **Export & rapports** | CSV pétitions, rapports donateurs, stats avancées admin | Basse |
| **App mobile native** | React Native ou Flutter (optionnel, long terme) | Basse |

### 17.3 Parcours utilisateurs V3

| Profil | Parcours |
|--------|----------|
| **Famille militaire** | Notification push → rejoint live → pose question au chat → reçoit réponse dossier |
| **Soutien / donateur** | Alerté d'un live FIKIN → regarde sur mobile → signe pétition en direct |
| **Bénévole** | Modère le chat live + traite dossiers depuis PWA |
| **Admin** | Lance un live, publie notification, suit métriques engagement |
| **Média / institution** | Accède au replay et dossier presse enrichi multilingue |

### 17.4 Stack technique V3 (recommandée)

| Couche | Évolution par rapport à V2 |
|--------|----------------------------|
| **Base de données** | PostgreSQL (production) — fin de `store.json` |
| **Live stream** | Mux, LiveKit, ou YouTube Live API + chat WebSocket |
| **Temps réel** | Socket.io ou Pusher pour chat et notifications |
| **PWA** | `next-pwa` ou Workbox, manifest, service worker |
| **Push** | Web Push API (VAPID) + fallback SMS (optionnel) |
| **i18n** | `next-intl` — FR, EN, Lingala (`ln`), Swahili (`sw`) |
| **CDN** | Cloudflare pour assets, cache RDC |
| **Emails** | Resend ou Brevo (finaliser report V2) |

### 17.5 Sécurité V3

| Mesure | Détail |
|--------|--------|
| Modération chat live | Filtres mots, file d'attente, bannissement IP/session |
| Protection mineurs live | Accès restreint, modération renforcée, pas de DM |
| Push notifications | Consentement explicite, désabonnement facile |
| Webhooks live | Signature vérifiée, rate limiting |
| Données | Chiffrement PostgreSQL, sauvegardes automatiques quotidiennes |
| PWA | HTTPS obligatoire, CSP renforcée |

### 17.6 Calendrier V3 proposé

| Phase | Durée estimée | Livrable |
|-------|---------------|----------|
| Conception live + PWA | 2 semaines | Maquettes, choix stack streaming |
| Migration PostgreSQL | 2 semaines | BDD production + import données |
| Live stream + chat | 4 semaines | Module live fonctionnel |
| Notifications push | 2 semaines | PWA + abonnements |
| Lingala + Swahili | 4 semaines | 80 % contenu traduit |
| Emails transactionnels | 2 semaines | Finaliser report V2 |
| Tests RDC (3G) | 2 semaines | Performance, accessibilité |
| Lancement V3 | — | cfmasbl.com — mobilisation complète |

**Durée totale estimée : 4 à 5 mois**

### 17.7 Budget V3 estimé

| Poste | Coût estimé |
|-------|-------------|
| Infra V1/V2 (domaine + VPS) | ~60 USD/an |
| Streaming (Mux / LiveKit) | ~0–50 USD/mois selon usage |
| Push / temps réel (Pusher) | Gratuit–25 USD/mois |
| PostgreSQL (VPS inclus) | Inclus dans VPS |
| Traduction contenu | Bénévolat ou ~200–500 USD |
| **Total infra additionnel** | **~100–300 USD/an** |

### 17.8 Critères de validation V3

| Critère | Cible |
|---------|-------|
| Premier live natif | 1 événement avec 50+ participants |
| Chat modéré | 0 incident non modéré |
| Notifications push | 200+ abonnés |
| Lingala + Swahili | 80 % pages principales |
| PWA installable | Fonctionnel Android + desktop |
| Temps chargement 3G | < 5 s page d'accueil |
| Migration PostgreSQL | Zéro perte de données |

### 17.9 Dépendances V3

| Prérequis | Détail |
|-----------|--------|
| V2 stable en production | cfmasbl.com déployé, comptes membres actifs |
| VPS Linux | Node.js 20+, PostgreSQL 15+ |
| HTTPS + domaine | Let's Encrypt sur cfmasbl.com |
| Modérateurs formés | Chat live et protection mineurs |
| Contenus traduits | Rédaction Lingala / Swahili validée par locuteurs natifs |

---

*Mise à jour : juin 2026 — V1 et V2 réalisées et validées ; plan V3 défini, implémentation à venir.*

---

## 18. Post-V2 — Améliorations réalisées

| # | Fonctionnalité | Livrable | Statut |
|---|----------------|----------|--------|
| 1 | Mot de passe oublié | `/membre/mot-de-passe-oublie`, `/membre/reinitialiser-mot-de-passe`, API reset | ✅ Réalisé |
| 2 | Notifications email | `lib/email.ts` — inscription, activation, aide, mises à jour dossier | ✅ Réalisé |
| 3 | Reçus donateurs | Email automatique (démo + webhook PayDunya) | ✅ Réalisé |
| 4 | Export CSV pétitions | `/api/admin/export/petitions/[id]` + bouton admin | ✅ Réalisé |
| 5 | PayDunya production | `lib/paydunya.ts`, webhook, redirection paiement | ✅ Réalisé |
| 6 | Contenu EN pages | Accueil, contact, à propos, s'engager, auth (~80 % titres/CTA) | ✅ Réalisé |
| 7 | Migration PostgreSQL | `scripts/schema.sql`, guide `MIGRATION-POSTGRES.md` | ✅ Schéma prêt |

### Configuration post-V2

| Variable | Usage |
|----------|-------|
| `SMTP_*` | Envoi email production (sinon log `data/emails.log`) |
| `NEXT_PUBLIC_SITE_URL` | Liens reset password, callbacks PayDunya |
| `MOBILE_MONEY_MODE=production` | Active PayDunya au lieu du mode démo |
| `PAYDUNYA_*` | Clés API PayDunya |

### Critères de validation post-V2

| Critère | Cible |
|---------|-------|
| Reset password | Lien email → nouveau mot de passe OK |
| Emails | Log fichier ou SMTP selon config |
| Export CSV | Téléchargement UTF-8 avec BOM |
| PayDunya | Redirection checkout en production |
| i18n EN | Pages principales traduites (titres + contenus clés) |

---

*Mise à jour : juin 2026 — Post-V2 réalisé ; V3 en attente de validation utilisateur.*

---

## 19. V3 — Mobilisation réalisée

| # | Module | Livrable | Statut |
|---|--------|----------|--------|
| 1 | Live stream | `/live`, `/live/[slug]`, player YouTube/stream/replay | ✅ Réalisé |
| 2 | Chat live | Polling 3s, modération admin, filtre mots | ✅ Réalisé |
| 3 | Sondages live | Votes en direct pendant événements | ✅ Réalisé |
| 4 | PWA | `manifest.json`, `sw.js`, cache pages clés | ✅ Réalisé |
| 5 | Push notifications | Web Push VAPID, abonnement par thème | ✅ Réalisé |
| 6 | Lingala (LN) | Navigation + pages principales (~80 %) | ✅ Réalisé |
| 7 | Swahili (SW) | Navigation + pages principales (~80 %) | ✅ Réalisé |
| 8 | Admin V3 | Onglet Live & Push, modération, sondages | ✅ Réalisé |
| 9 | PostgreSQL | Schéma V3 étendu + guide migration | ✅ Schéma prêt |

### Configuration V3

| Variable | Usage |
|----------|-------|
| `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Notifications push (`node scripts/generate-vapid.mjs`) |
| `NEXT_PUBLIC_SITE_URL` | Liens push et callbacks |
| `DATABASE_URL` | Migration PostgreSQL (runtime reste JSON jusqu'à bascule VPS) |

### Parcours validables

| Test | Action |
|------|--------|
| Live | Admin → V3 → créer événement → Démarrer live → `/live/[slug]` |
| Chat | Poster message → modérer si pending |
| Sondage | Admin → + Sondage → voter pendant live |
| PWA | Installer depuis navigateur (HTTPS requis en prod) |
| Push | Bouton alertes sur `/live` + notif au démarrage live |
| i18n | Basculer LN / SW dans le header |

---

*Mise à jour : juin 2026 — V3 réalisée.*

---

## 20. V3 — Étapes réalisées et validées

| # | Étape | Livrable | Statut | Validation |
|---|-------|----------|--------|------------|
| 1 | Modèle de données V3 | `live_events`, `live_chat_messages`, `live_polls`, `live_poll_votes`, `push_subscriptions` dans `store.json` | ✅ Réalisé | Migration auto `migrateV3` au chargement |
| 2 | Page liste lives | `/live` — événements live, replay, programmés | ✅ Réalisé | HTTP 200, événement seed FIKIN 2025 |
| 3 | Page live individuelle | `/live/[slug]` — player + chat + sondages | ✅ Réalisé | Parcours complet testé |
| 4 | Player intégré | YouTube ID, URL stream, lien replay | ✅ Réalisé | Fallback embed + replay externe |
| 5 | Chat live | API `/api/live/[slug]/chat`, polling 3 s | ✅ Réalisé | Messages postés et affichés |
| 6 | Modération chat | File pending, approbation/rejet admin | ✅ Réalisé | Onglet V3 + filtre mots |
| 7 | Sondages live | Création admin, votes en direct, anti-doublon | ✅ Réalisé | Cookie `cfm_voter` |
| 8 | Push au démarrage live | Notification thème `lives` automatique | ✅ Réalisé | Déclenché via admin « Démarrer live » |
| 9 | Abonnement push | `/api/push/subscribe`, thèmes lives/campaigns/help | ✅ Réalisé | Bouton sur `/live` |
| 10 | PWA installable | `manifest.json`, `sw.js`, icône, cache pages clés | ✅ Réalisé | Service worker enregistré |
| 11 | Lingala (LN) | Sélecteur header, nav + pages principales (~80 %) | ✅ Réalisé | Cookie `cfm_locale=ln` |
| 12 | Swahili (SW) | Sélecteur header, nav + pages principales (~80 %) | ✅ Réalisé | Cookie `cfm_locale=sw` |
| 13 | Admin V3 | Onglet « V3 Live & Push » — créer, démarrer, terminer live | ✅ Réalisé | Dashboard admin opérationnel |
| 14 | Push manuel admin | Envoi par thème depuis dashboard | ✅ Réalisé | API `/api/admin/live` |
| 15 | Push mise à jour aide | Notification thème `help` sur update dossier | ✅ Réalisé | Intégré route admin |
| 16 | Schéma PostgreSQL V3 | `scripts/schema.sql` — tables live, chat, polls, push | ✅ Réalisé | Schéma prêt, import manuel |
| 17 | Génération clés VAPID | `scripts/generate-vapid.mjs` | ✅ Réalisé | Variables `.env` documentées |
| 18 | Lien accueil → live | Section live page d'accueil + nav header | ✅ Réalisé | CTA `/live` |
| 19 | Build production | Compilation sans erreur | ✅ Réalisé | `npm run build` OK — 47 routes |
| 20 | Tests parcours V3 | Live, chat, sondage, i18n LN/SW, PWA | ✅ Validé | Juin 2026 — dev local OK |

### Synthèse V3

| Indicateur | Résultat |
|------------|----------|
| Pages live | 2/2 opérationnelles (`/live`, `/live/[slug]`) |
| Routes API V3 | 10+ fonctionnelles (live, chat, polls, push, admin) |
| Langues interface | FR + EN + LN + SW |
| PWA | Manifest + service worker actifs |
| Push notifications | Web Push VAPID (HTTPS requis en prod) |
| Admin V3 | Onglet dédié opérationnel |
| PostgreSQL runtime | ⏳ Schéma prêt — `store.json` conservé en dev |

### Reporté post-V3 (améliorations futures)

| Fonctionnalité | Statut |
|----------------|--------|
| PostgreSQL en production (fin `store.json`) | ⏳ Schéma prêt, bascule runtime à faire |
| WebSocket temps réel (chat, notifications) | ⏳ Polling 3 s utilisé en V3 |
| Streaming Mux / LiveKit natif | ⏳ YouTube embed + URL stream en V3 |
| Traduction contenu validée par locuteurs natifs | ⏳ Traductions initiales LN/SW |
| Optimisation performance 3G RDC | ⏳ Non mesurée en conditions réelles |
| App mobile native (React Native / Flutter) | ⏳ PWA seulement |
| SMS fallback notifications | ⏳ Non implémenté |
| Bannissement IP/session chat | ⏳ Modération manuelle seulement |
| Analytics & rapports avancés admin | ⏳ Stats basiques |
| Déploiement production cfmasbl.com | ⏳ Dev local validé |

---

## 21. Plan V4 — Consolidation & production (sans implémentation)

### 21.1 Objectifs V4

| Objectif | Description |
|----------|-------------|
| **Production cfmasbl.com** | Déploiement VPS Linux, HTTPS, domaine actif |
| **PostgreSQL production** | Fin de `store.json`, adaptateur BDD runtime, import données |
| **Streaming professionnel** | Mux ou LiveKit — qualité adaptée connexions RDC |
| **Temps réel natif** | WebSocket (Socket.io / Pusher) — chat et notifications instantanés |
| **Performance 3G** | Optimisation chargement < 5 s, images compressées, lazy load |
| **Traductions certifiées** | Contenu LN/SW validé par locuteurs natifs, 100 % pages clés |
| **Analytics & impact** | Tableaux de bord engagement, rapports donateurs, export avancé |
| **Sécurité production** | Backups quotidiens, monitoring, CSP, rate limiting |

### 21.2 Périmètre fonctionnel V4

| Module | Fonctionnalités prévues | Priorité |
|--------|-------------------------|----------|
| **Déploiement VPS** | Node.js 20+, PM2, Nginx, Let's Encrypt, Cloudflare CDN | Haute |
| **Migration PostgreSQL** | Adaptateur runtime, script import complet, zéro perte données | Haute |
| **Streaming pro** | Mux/LiveKit intégré, bitrate adaptatif, replay automatique | Haute |
| **WebSocket** | Chat instantané, présence viewers, sondages temps réel | Haute |
| **Performance RDC** | Audit Lighthouse 3G, compression, cache CDN, fonts optimisées | Haute |
| **Traductions natives** | Révision LN/SW par locuteurs, formulaires traduits à 100 % | Moyenne |
| **SMS notifications** | Fallback push via API SMS (Orange RDC ou Twilio) | Moyenne |
| **Modération avancée** | Bannissement IP/session, logs modération, file prioritaire mineurs | Moyenne |
| **Analytics admin** | Métriques live (viewers, rétention), dons, adhésions, push | Moyenne |
| **Emails production** | Resend ou Brevo — remplacement log fichier / SMTP basique | Moyenne |
| **App mobile native** | React Native ou Flutter (optionnel, si budget) | Basse |
| **CI/CD** | GitHub Actions — build, tests, déploiement automatique VPS | Basse |

### 21.3 Parcours utilisateurs V4

| Profil | Parcours |
|--------|----------|
| **Famille militaire (3G Kinshasa)** | Push instantané → live fluide → chat temps réel → réponse dossier SMS si hors-ligne |
| **Soutien / donateur** | Live FIKIN HD → signature pétition → reçu email automatique Resend |
| **Bénévole** | Modération chat WebSocket depuis PWA → traitement dossiers PostgreSQL |
| **Admin** | Dashboard analytics → lance live Mux → export rapports mensuels |
| **Média / institution** | Dossier presse multilingue certifié → replay haute qualité |

### 21.4 Stack technique V4 (recommandée)

| Couche | Évolution par rapport à V3 |
|--------|----------------------------|
| **Base de données** | PostgreSQL 15+ en production — `pg` ou Prisma, fin `store.json` |
| **Hébergement** | VPS Linux (2 GB RAM min.) + Cloudflare CDN + Let's Encrypt |
| **Process manager** | PM2 ou systemd — redémarrage auto, logs centralisés |
| **Live stream** | Mux ou LiveKit — HLS adaptatif, enregistrement replay auto |
| **Temps réel** | Socket.io ou Pusher — remplace polling chat 3 s |
| **Emails** | Resend ou Brevo — templates transactionnels complets |
| **SMS** | API Orange RDC ou Twilio — fallback push |
| **Monitoring** | Uptime Kuma ou Datadog (gratuit) — alertes downtime |
| **CI/CD** | GitHub Actions → déploiement VPS automatisé |
| **i18n** | `next-intl` — gestion centralisée 4 langues + validation workflow |

### 21.5 Sécurité V4

| Mesure | Détail |
|--------|--------|
| HTTPS obligatoire | Let's Encrypt auto-renew, HSTS activé |
| Backups PostgreSQL | Sauvegarde quotidienne automatique, rétention 30 jours |
| Rate limiting | API routes sensibles (auth, chat, push) — 100 req/min/IP |
| CSP renforcée | Content Security Policy stricte en production |
| Secrets management | Variables env VPS, jamais en repo Git |
| Modération mineurs | Accès live restreint < 18 ans, modération renforcée, logs |
| Webhooks signés | PayDunya, Mux — vérification signature obligatoire |
| RGPD / confidentialité | Export données membre, droit à l'effacement |

### 21.6 Calendrier V4 proposé

| Phase | Durée estimée | Livrable |
|-------|---------------|----------|
| Setup VPS + domaine | 1 semaine | cfmasbl.com en HTTPS |
| Migration PostgreSQL | 2 semaines | BDD production + import `store.json` |
| Adaptateur runtime BDD | 2 semaines | Fin `store.json`, tests non-régression |
| Streaming Mux/LiveKit | 3 semaines | Live pro avec replay auto |
| WebSocket chat | 2 semaines | Chat instantané, présence viewers |
| Performance 3G | 2 semaines | Audit + optimisations, < 5 s accueil |
| Traductions certifiées | 3 semaines | LN/SW validés par locuteurs natifs |
| Analytics admin | 2 semaines | Dashboard métriques engagement |
| Emails Resend/Brevo | 1 semaine | Templates production complets |
| Tests production RDC | 2 semaines | Tests 3G, charge, sécurité |
| Lancement V4 | — | cfmasbl.com — production stable |

**Durée totale estimée : 4 à 5 mois**

### 21.7 Budget V4 estimé

| Poste | Coût estimé |
|-------|-------------|
| VPS Linux (2 GB RAM) | ~5–10 USD/mois (~60–120 USD/an) |
| Domaine cfmasbl.com | ~10–15 USD/an |
| Cloudflare CDN | Gratuit (plan Free) |
| Mux streaming | ~0–50 USD/mois selon usage |
| Pusher / Socket.io (self-hosted) | Gratuit–25 USD/mois |
| Resend emails | Gratuit–20 USD/mois (< 3 000 emails) |
| SMS (optionnel) | ~0,05 USD/SMS |
| Traduction certifiée LN/SW | Bénévolat ou ~300–600 USD |
| **Total infra V4** | **~150–400 USD/an** |

### 21.8 Critères de validation V4

| Critère | Cible |
|---------|-------|
| Site en production | cfmasbl.com accessible HTTPS 99,9 % uptime |
| Migration PostgreSQL | Zéro perte de données, toutes entités migrées |
| Live Mux/LiveKit | 1 événement 100+ viewers, qualité adaptative OK |
| Chat WebSocket | Latence < 500 ms, 0 perte messages |
| Performance 3G | Page accueil < 5 s (Lighthouse mobile 3G) |
| Traductions LN/SW | 100 % pages clés validées par locuteurs natifs |
| Push + SMS | 500+ abonnés push, SMS fallback fonctionnel |
| Backups | Restauration testée en < 1 h |
| Emails production | 100 % emails transactionnels via Resend/Brevo |

### 21.9 Dépendances V4

| Prérequis | Détail |
|-----------|--------|
| V3 stable et validée | Live, PWA, push, i18n LN/SW opérationnels |
| VPS Linux provisionné | Ubuntu 22.04+, Node.js 20+, PostgreSQL 15+ |
| Domaine cfmasbl.com | DNS configuré, accès registrar |
| Compte Mux ou LiveKit | Clés API streaming |
| Compte Resend ou Brevo | Clés API emails production |
| Locuteurs natifs LN/SW | Validation contenu traduit |
| Modérateurs formés | Chat live, protection mineurs, procédures urgence |
| Budget infra validé | ~150–400 USD/an approuvé par l'ASBL |

---

*Mise à jour : juin 2026 — V3 réalisée et validée ; plan V4 défini, implémentation à venir.*

