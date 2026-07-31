# Audit des écrans — CFM (vitrine publique + portail membre)

> Objectif : cadrer la **finalité de comportement** par écran, valider le **rendu réel en prod** (`cfm-asbl.vercel.app`), repérer les **bloquants go-live**.
> Périmètre audité : Accueil, Chrome (header/footer), S'engager, Contact, Tunnel auth, Pétitions, Live, Portail membre (12 écrans).
> **Non** audité : pages informationnelles publiques (a-propos, axes, actions, plaidoyer, presse, actualités, légal) et back-office admin.

Légende priorités : 🔴 P0 bloquant · 🟠 P1 cohérence · 🟡 P2 finition.

---

## 🚦 Synthèse — bloquants go-live transversaux

> **Constat central** : le **code applicatif est solide et bien conçu** (atomicité testée par la CI installée, tél-first cohérent, accès role-gardé, privacy soignée, dégradation gracieuse, états vides gérés). Les bloquants ne sont **presque jamais du code** — ce sont **contenu & config d'un déploiement resté en mode démo/test**.

| # | Bloquant | Portée | Nature | Correctif |
|---|---|---|---|---|
| 1 | 🔴 **Identité de marque non configurée** — `site.name`=« cri de familles militaires », `site.sigle`=« sigle (CFM) » | `<title>`, logo, footer, copyright → **toutes les pages** | Contenu | Admin : name=« **Cris des Familles Militaires** », sigle=« **CFM** » (2 valeurs) |
| 2 | 🔴 **Paiements en mode démo** — le don n'encaisse rien + fuite « Configurez MOBILE_MONEY_MODE=production » au public | /s-engager, dons | Config | `MOBILE_MONEY_MODE` + `NEXT_PUBLIC_MOBILE_MONEY_MODE`=`production` + clés PayDunya |
| 3 | 🔴 **Tracking CTA dormant** — aucune mesure des conversions (pas de GA/sink) | tout le site | Code/config | Brancher un sink (`/api/analytics` sur `cfm:cta`, ou GA4) ou retirer l'instrumentation |
| 4 | 🟠 **Temps réel live off** — Pusher non configuré → chat/sondages en polling ~10-15 s | /live | Config | Config Pusher, ou assumer le polling |
| 5 | 🟠 **Live de test « permanent »** — « DISCOUR DU PR.FELIX » en statut *live* (faux direct animé partout) | accueil + /live | Contenu/ops | Repasser en replay + process de fin de direct |
| 6 | 🟠 **`NEXT_PUBLIC_SITE_URL`** à confirmer sur Vercel (emails, reset mdp, callbacks PayDunya en dépendent ; mitigé par PR #39) | serveur | Config | Vérifier = `https://cfm-asbl.vercel.app` en Production |
| 7 | 🟠 **Récupération mot de passe email-only** — membres tél-only bloqués (mitigé : email éditable en profil) | tunnel | Produit | SMS/OTP, ou message explicite « sans email, contactez un responsable » |

**Quick wins P1/P2 (par écran, détail plus bas)** : compteur de pétition figé après signature ; bloc témoignages vide non masqué ; « Dons & reçus » sans reçu ; newsletter sans RGPD/honeypot ; nav desktop sans Pétitions/Presse ; labels contact codés en dur ; `/contact` non statique.

---

## Écran 1 — Accueil `/` · [(site)/page.tsx](../src/app/(site)/page.tsx)

**Finalité** : page d'atterrissage vitrine → orienter vers 3 conversions (adhérer, don, aide), mettre en avant le live, capter des emails.

**Validé en prod** :
- ✅ Images valides et servies (Supabase + optimiseur Next). *(Le `naturalWidth=0` observé était un artefact du panneau navigateur non affiché, pas un défaut.)*
- ✅ Live ACTIF réel « DISCOUR DU PR.FELIX » + badge « En direct » (pas le fallback FIKIN).
- ✅ 2 témoignages rendus, newsletter présente, 13 CTA `data-cta`.
- 🔴 Tracking dormant : `gtag` undefined, pas de dataLayer, aucun GA → collecte nulle.

**Plan** :
- 🔴 Brancher un sink de tracking (endpoint interne `/api/analytics` sur l'event `cfm:cta`, OU GA4, OU retirer l'instrumentation).
- 🟠 Revue éditoriale du live (fautes « DISCOUR », « PR.FELIX ») + vérifier que « En direct » reflète la réalité.
- 🟠 Masquer le bloc témoignages si 0 témoignage ([page.tsx:247](../src/app/(site)/page.tsx:247)).
- 🟡 Newsletter : mention RGPD + lien `/confidentialite` + honeypot anti-bot.
- 🟡 Instrumenter Axes/Mission si mesure d'engagement voulue ; vidéo hero (fournir ou retirer le code mort) ; décider du bilingue (sélecteur FR/EN ou retirer branches EN mortes).

---

## Écran transversal — Chrome global (Header + Footer) · [(site)/layout.tsx](../src/app/(site)/layout.tsx)

Présent sur TOUTES les pages publiques. Header = client (état connexion résolu client-side via cookie-indice `cfm_member_hint` + `/api/member/status`). Footer = server (i18n avec overrides admin).

**Finalité** : navigation cohérente, accès aux conversions, identité de marque, liens légaux/sociaux.

**Validé en prod (DOM)** :
- 🔴 **Identité de marque cassée sur tout le site** — config `site_settings` mal remplie :
  - `site.sigle` = « **sigle (CFM)** » (le mot placeholder « sigle » est resté) → `<title>`, logo mobile, marque footer « sigle (CFM) ASBL ».
  - `site.name` = « **cri de familles militaires** » (slogan minuscule en guise de nom) → logo desktop, copyright « © 2026 cri de familles militaires ».
  - Correctif = 2 valeurs dans l'admin (name → nom propre capitalisé ; sigle → « CFM »). Corrige les 4 emplacements d'un coup.
- 🟠 **Nav desktop (9 liens) omet Pétitions & Presse** — accessibles seulement via footer + tiroir mobile. Découvrabilité desktop faible.
- ✅ Auth-state client bien conçu (pas de mismatch d'hydratation ; anonyme = 0 requête). Tiroir mobile verrouille le scroll. 4 réseaux sociaux configurés. Liens légaux présents.

**Plan** :
- 🔴 Corriger `site.name` + `site.sigle` dans l'admin (contenu ; impact SEO + crédibilité, page la plus indexée).
- 🟠 Ajouter Pétitions (et éventuellement Presse) à la nav desktop, ou assumer leur place en footer.
- 🟡 Dropdown Axes desktop = hover-only (pas d'ouverture clavier) → a11y.
- 🟡 Année de fondation : mission utilise `site.founded ?? 2018`, footer utilise `SITE.founded` (constante) → deux sources à unifier.
- 🟡 Dérive de commentaire dans Header (dit `/api/member/me`, appelle `/api/member/status`).

---

## Écran 2 — S'engager `/s-engager` · [(site)/s-engager/page.tsx](../src/app/(site)/s-engager/page.tsx)

**Finalité** : hub de conversion. 3 chemins → (1) créer un compte membre complet (`/membre/inscription`), (2) **adhésion rapide** (MembershipForm → `POST /api/membership`), (3) **don** (DonationForm → `POST /api/donations` → PayDunya). + sections transparence & partenariat.

**Comportement** :
- MembershipForm : type (famille/soutien/benevole), champs conditionnels (military_link si famille, skills si benevole). **Email optionnel, téléphone requis** (cohérent tél-first). Succès → prefill sessionStorage → nudge `/membre/inscription` + promo compte.
- DonationForm : amount/currency/provider(orange/mpesa/airtel)/phone requis, donor optionnel. Si `paymentUrl` → redirection PayDunya ; sinon panneau succès local (démo). Callbacks via `getBaseUrl()` (PR #39 ✓).

**Validé en prod** :
- ✅ Formulaires rendus (tous champs), H1 « S'engager avec CFM » correct.
- 🔴 **DON EN MODE DÉMO** : notice rendu = « Mode démo : paiement simulé… » → **aucun encaissement réel**. Le CTA « Faire un don » (principale source de fonds) ne collecte rien.
- 🟠 Le notice démo **fuit une instruction technique au public** : « Configurez MOBILE_MONEY_MODE=production et PayDunya… ».
- 🔴 Brand bug « sigle (CFM) » présent (10× ici) — transversal.

**Plan** :
- 🔴 **Activer PayDunya réel avant go-live** : `MOBILE_MONEY_MODE` **et** `NEXT_PUBLIC_MOBILE_MONEY_MODE` = `production` + clés PayDunya (les 2 vars doivent être alignées, sinon notice/serveur divergent). Cf. [[cfm-actions-infra-en-attente]] / [[cfm-prod-deploy]].
- 🟠 Réécrire le message démo pour ne PAS exposer d'instruction technique (ou masquer le don tant qu'on est en démo).
- 🟠 Clarifier les 2 chemins d'adhésion (rapide vs compte complet) — wording/hiérarchie, éviter la double-saisie perçue.
- 🟡 Don : pas de mention RGPD (donor_email/phone), pas de reçu — à considérer.
- 🔴 Brand fix (transversal, cf. chrome).

> 💡 **Valeurs de marque correctes découvertes via /contact** : email `crisdesfamillesmilitaires@outlook.com` → nom = **« Cris des Familles Militaires »**, sigle = **« CFM »**. C'est ce qu'il faut poser dans `site_settings` (name/sigle) pour le correctif P0.

---

## Écran 3 — Contact `/contact` · [(site)/contact/page.tsx](../src/app/(site)/contact/page.tsx)

**Finalité** : 3ᵉ conversion (**demande d'aide confidentielle**, section `#aide` ciblée par tous les CTA « Demander de l'aide ») + contact général + coordonnées.

**Comportement** :
- 3 cartes : email (mailto), téléphone, pays — depuis `site_settings`.
- `#aide` → **HelpRequestForm** : tél requis / email optionnel (tél-first), province requise, **protection mineurs** (âge<18 → consentement parental requis), need_type requis. `POST /api/help` (données chiffrées, ADR 0003). Succès → nudge `/membre/inscription`.
- Contact général → **ContactForm** : email **requis** (canal de réponse), `type` depuis `?type=partenariat`. `POST /api/contact`. Succès → `/actions`.

**Validé en prod** :
- ✅ Ancre `#aide` présente, 2 formulaires rendus, **coordonnées réelles** (`crisdesfamillesmilitaires@outlook.com`, +243 963983663, RDC/Kinshasa).
- 🟡 Page **dynamique, non cachée** (`Cache-Control: no-store`, `X-Vercel-Cache: MISS`) à cause de `searchParams` — seule page publique non statique.
- 🔴 Brand « sigle (CFM) » 10× (transversal).

**Plan** :
- 🔴 Brand fix (transversal).
- 🟡 Statifier `/contact` : lire `type` côté client (`useSearchParams`) pour retirer la dépendance `searchParams` serveur → page statique. *(Faible priorité, trafic faible.)*
- 🟡 Labels HelpRequestForm/ContactForm **codés en dur (FR)** au lieu de l'i18n — incohérence (mineure, site FR-only).
- 🟡 ContactForm : `<input type="hidden" name="type">` mort (le fetch envoie le JSON) — nettoyage.
- 🟢 Bons points : protection mineurs, messaging confidentialité, tél-first cohérent, coordonnées réelles configurées.

---

## Écran 4 — Tunnel d'authentification `(site)/membre/*` (noindex, follow)

**Finalité** : transformer les conversions (adhésion/aide) en comptes membres ; connexion ; récupération. 4 pages : inscription, connexion, mot-de-passe-oublié, réinitialisation.

**Comportement** :
- **Inscription** ([MemberRegisterForm](../src/components/member/MemberRegisterForm.tsx)) : prefill depuis /s-engager (consommé à la lecture → anti-fuite poste partagé), **tél-first + écho de normalisation live** (« → +243… »), email optionnel, mot de passe min 8 + confirmation, champs conditionnels (famille/benevole), gestion robuste des erreurs passerelle (HTML 502/504), **reste sur la page après succès** (compte en attente de validation → pas de redirection trompeuse). Aligné inscription de masse (cf. [[cfm-c0-inscriptions-masse]]).
- **Connexion** ([MemberLoginForm](../src/components/member/MemberLoginForm.tsx)) : **identifiant unique (tél OU email)**, `type="text"` volontaire (un champ email refuserait « 0812345678 »). → `/api/member/login` → `/membre`.
- **Mot de passe oublié** : champ **email uniquement** → `/api/member/forgot-password` (anti-énumération : succès identique quoi qu'il arrive).
- **Réinitialisation** : token depuis `?token=` (page **dynamique**), password+confirm min 8, « Lien invalide » si pas de token, redirection connexion après 2 s.

**Validé en prod** :
- ✅ Les 4 pages émettent `<meta name="robots" content="noindex, follow">` (confirme la politique d'indexation).
- ✅ Champs conformes : identifiant unique (login), tél-first (inscription), email-only (forgot).

**Plan** :
- 🟠 **Récupération self-service email-only** : les membres **sans email** (majorité tél-first) ne peuvent pas réinitialiser seuls → dépendance à un responsable/admin. Envisager récupération par **téléphone (SMS/OTP)**, ou a minima un message clair sur la page (« sans email, contactez un responsable »). Cf. [[cfm-connexion-telephone]].
- 🟡 `/membre/reinitialiser-mot-de-passe` dynamique (`searchParams` token) — acceptable (lien email) mais noté.
- 🟢 Bons points nombreux : prefill anti-fuite, normalisation tél live, gestion erreurs passerelle, identifiant mixte, noindex correct, robustesse inscription de masse.

---

## Écran 5 — Pétitions `/petitions` + `/petitions/[slug]` (interactif)

**Finalité** : mobilisation citoyenne → **signer une pétition** (capture + engagement), nudge vers compte membre.

**Comportement** :
- **Liste** : pétitions actives (cache), barres de progression (`signatures_count/goal`), → détail (`cta_petition`) + promo compte.
- **Détail** : **SSG** (`generateStaticParams` sur pétitions actives), `notFound()` si absent, barre de progression, **PetitionSignForm**.
- **Signature** ([PetitionSignForm](../src/components/PetitionSignForm.tsx)) : name + **email requis** (dedup/vérif), `POST /api/petitions/[slug]`, **idempotence serveur** (unique email/pétition → ALREADY_EXISTS) — c'est le chemin testé par la CI (PR #36). Succès → panneau + promo compte, champs vidés.

**Validé en prod** :
- ✅ 2 pétitions actives réelles (réforme protection familles ; autonomisation femmes/veuves), détail SSG, formulaire présent, **indexable** (correct, au sitemap).
- 📊 Les 2 à **0 signature** (barre à 0 %).
- 🔴 Brand « sigle (CFM) » (transversal).

**Plan** :
- 🟠 **Aucun retour visuel après signature** : compteur/progression figé (rendu serveur caché, pas d'increment optimiste ni refetch) → le signataire ne voit pas sa signature comptée. Corriger : increment optimiste client (ou refetch du compteur) + `revalidateTag` après POST.
- 🟡 **0 signature = barre à 0 %** : effet décourageant (« personne ne signe »). → message « Soyez le/la premier·e » ou seed.
- 🟡 Compteur potentiellement périmé (cache TTL) — acceptable seul, aggrave l'impression d'inertie combiné au point ci-dessus.
- 🔴 Brand fix (transversal).
- 🟢 Bons points : idempotence serveur (testée par la CI installée), SSG, indexation correcte.

---

## Écran 6 — Live `/live` + `/live/[slug]` (interactif, le plus riche)

**Finalité** : diffuser directs/replays, **engagement temps réel** (chat modéré, sondages), **alertes push**, capter emails.

**Comportement** :
- **Liste** : bouton push (alertes), bloc live actif, grille des événements (badge statut), NextActionBlock.
- **Détail** : **LiveRoom** = lecteur (YouTube/stream/replay) + badge statut + spectateurs + **LiveChat** + **LivePolls**.
- **Chat** ([LiveChat](../src/components/live/LiveChat.tsx)) : **Pusher si configuré, sinon repli polling** (10 s, full reload tous les 6 ticks pour refléter la modération, pause onglet caché). Modération (statut `pending`). Fermé en replay. `POST /api/live/[slug]/chat`, maxLength 500, auto-scroll respectueux (seulement si déjà en bas).
- **Sondages** ([LivePolls](../src/components/live/LivePolls.tsx)) : vote `POST /api/live/[slug]/polls/[id]/vote` (**atomique**, PR #36, testé par CI), **résultats masqués avant vote** (n'influence pas), refresh 15 s, 1 vote/sondage (Set client + `ALREADY_VOTED` serveur).
- **Push** : PushSubscribeButton (web-push VAPID).

**Validé en prod** :
- ✅ Live actif « DISCOUR DU PR.FELIX » (embed YouTube), chat ouvert mais **vide**, section sondages, bouton alertes, indexable.
- 🔴 **Pusher NON configuré** → chat/sondages en **repli polling** (~10 s / 15 s), pas de vrai temps réel.
- 🟠 Événement live = **0 spectateur, 0 message, titre fauté**, marqué « En direct » en permanence → très probablement **donnée de test restée en statut live**, diffusant un faux direct animé sur **tout le site** (hero accueil + section live + /live).
- 🟡 Compteur spectateurs à 0 / non incrémenté à la vue.

**Plan** :
- 🟠 **Corriger le live « permanent »** : passer « DISCOUR DU PR.FELIX » en replay/ended (ou corriger le titre), et **définir un process** (qui repasse un live en replay après diffusion). Impact fort : le faux « En direct » est visible partout.
- 🔴 **Configurer Pusher** (NEXT_PUBLIC_PUSHER_KEY/CLUSTER + serveur) pour un vrai temps réel, OU assumer le polling (moins d'infra, chat/sondages avec ~10 s de latence).
- 🟡 Vérifier **VAPID** (web-push) configuré, sinon « Notifications non disponibles ».
- 🟡 Compteur spectateurs (incrémenter à la vue, ou masquer).
- 🟢 Bons points : dégradation gracieuse (polling + pause onglet), modération chat, vote atomique (testé CI), résultats masqués avant vote, auto-scroll respectueux.

---

# PORTAIL MEMBRE (privé, `(portail)/membre/*`, noindex,nofollow)

> Auth-gated : non validable visuellement sans session → audit **basé sur le code**. Portail **multilingue** (LocaleSwitcher), contrairement à la vitrine FR-only.

## Écran transversal — Chrome portail + contrôle d'accès

**Comportement** : sidebar ([PortalShell](../src/components/portail/PortalShell.tsx)) à **nav filtrée par rôle** (`portalRole` : famille / benevole / coordinateur), topbar + LocaleSwitcher, tiroir mobile, logout (`POST /api/member/logout`).

**Contrôle d'accès (vérifié)** :
- ✅ **Auth** : layout + chaque page `redirect("/membre/connexion")` si non connecté (défense en profondeur).
- ✅ **Rôle coordination** (données cross-familles/province) : **gardé serveur** — `member.role !== "coordinator" → redirect("/membre")`.
- 🟡 **Rôle aide/famille** : `roleOnly:"famille"` **en nav uniquement**, pas de garde au niveau page. MAIS ces pages n'exposent que les **données propres** de l'utilisateur (ses dossiers / ses liens) → un non-famille y accède par URL mais voit du **vide**. Incohérence nav/UX, **pas une faille**.

**Plan** :
- 🟡 Ajouter une garde de rôle (ou rediriger) sur `/membre/aide` et `/membre/famille` pour la cohérence (aujourd'hui accessibles par URL hors nav).
- 🟡 `getCoordinationStats()` est appelé pour **tous** les rôles au dashboard (requête même si non affichée aux non-coordinateurs) — perf.

## Écran 7 — Dashboard `/membre` (Fil d'annonces)

**Finalité** : accueil connecté — annonces officielles CFM (campagnes + actualités), prochains événements, préférences d'alertes ; en-tête à stats pour coordinateur.

**Comportement** : feed campagnes(1)+actus(2) avec état vide « Aucune annonce » ; rail « Prochains événements »(2 → /membre/evenements) + **AlertToggles** (préférences push) ; **PortalHomeHeader** affiche des stats de coordination si coordinateur (familles suivies, demandes à traiter, événements).

**Constats** :
- ✅ États vides gérés (feed, événements). Marque « CFM ASBL » en dur ici (correcte, pas le bug `site.name`).
- 🟡 Feed limité à contenu réel (campagnes/actus publiées) — dépend du remplissage admin.

## Écrans 8-18 — Les 11 pages du portail (passage compact)

| Page | Finalité | Endpoint / mutation | Constat |
|---|---|---|---|
| **profil** | éditer profil, **ajouter email**, changer mot de passe | `PATCH /api/member/me`, `POST /api/member/password` | ✅ email éditable = récupération activable pour tél-only ; 🟡 pas d'UI de **révocation de session** |
| **evenements** | événements + RSVP | `POST /api/member/events` (toggle) | ✅ **capacité** (`full`→Complet) + **`router.refresh()`** met à jour le compteur ; atomique/idempotent (PR #36, testé CI) |
| **famille** (roleOnly famille) | liens familiaux | FamilyLinkManager (request/approve/reject) | données propres ; pas de garde de rôle page (cf. accès) |
| **dons** | historique dons + total | lecture `getMemberDashboard` | 🟠 titre « Dons & **reçus** » mais **aucun reçu téléchargeable** (juste table statut) ; « Faire un don » → /s-engager#don (**mode démo**) |
| **messages** | échange membre↔référent | `markMessagesRead` à l'ouverture + MessageComposer | ✅ auto-lu, accusé auto (référent) |
| **entraide** | missions bénévoles (demandes d'aide ouvertes) | ClaimButton | ✅ **confidentialité respectée** : n'expose que need_type+province, détails **après acceptation** + modéré |
| **aide** (roleOnly famille) | ses dossiers d'aide + nouvelle demande | getMemberDashboard + HelpRequestForm | données propres ; pas de garde rôle page |
| **medias** | galerie photos/vidéos | lecture galerie | ✅ état vide géré ; dépend contenu admin |
| **ressources** | guides/docs par catégorie | lecture | ✅ état vide ; dépend contenu admin |
| **petitions** | liste pétitions actives | → lien vers public `/petitions/[slug]` | 🟡 le membre connecté signe via le form public (name+email) — pas de pré-remplissage/signature « en tant que membre » |
| **coordination** (roleOnly coord.) | KPIs province | `getCoordinationStats` (role-gardé) | ✅ rôle vérifié serveur ; lecture seule |

**Constats transversaux portail** :
- ✅ **Auth partout**, accès sensible (coordination) role-gardé, **états vides gérés sur toutes les pages**, bonne conception privacy (entraide).
- 🟠 **dons sans reçu** malgré le titre → générer un reçu (PDF/impression) ou retirer « & reçus ».
- 🟡 Garde de rôle page manquante sur aide/famille (cosmétique, données propres) ; révocation de session non exposée ; beaucoup de pages **dépendent du remplissage admin** (galerie, ressources, actus, événements) → états vides tant que non peuplé.

---

# ADMIN / BACK-OFFICE (`/admin`, mot de passe + volunteer, noindex + robots Disallow)

> Auth-gated → audit **basé sur le code**. Structure : `/admin` (login), `/admin/dashboard` (SPA ~13 panneaux, lazy), `/admin/style-guide` (dev).

## Écran 19 — Admin : accès & RBAC

**Finalité** : console de gestion unique — contenu, formulaires (inbox), territoire, communauté (users), dons, live, identité (settings), pages, i18n, partenaires, audit.

**Contrôle d'accès (vérifié)** :
- `getAdminAccess()` → `"admin"` (session mot de passe) | `"volunteer"` (membre `role==="volunteer"`, posé **uniquement par un admin**) | `null`. Login = **form HTML natif** (résilient si JS/chunks échouent).
- **Deux gardes** : `requireAdminRole()` (strict, admin-only → **403** bénévole) vs `requireAdminAccess()` (souple, admin **ou** bénévole).
  - **Strict (admin-only)** ✅ : `/users`, **`/users/[id]/role`**, `/users/[id]/activate`, contenu (testimonials/studies/campaigns), **`/data`** (dump complet), `/stats`, `/audit`, **`/export/[entity]`** (PII).
  - **Souple (bénévole OK)** : modération chat/live, gestion live/sondages, **i18n**, **`/donations/[id]`**.
- **Révocation de session** au changement de mot de passe (rejette les sessions antérieures) ✅.

**Constats** :
- 🟢 **Sécurité solide** : escalade fermée (rôles/users/export/data admin-only), un bénévole **ne peut ni s'élever ni exfiltrer la PII**, révocation de session effective, login résilient, panneau d'**audit** (traçabilité).
- 🟠 **Accès bénévole incohérent/cassé** : `getAdminAccess` laisse entrer un bénévole sur `/admin/dashboard`, mais `loadAdminBundle` appelle `/api/admin/data` (strict) → **403** → écran d'erreur (jamais de données, **pas de fuite**). → soit une vue bénévole *scopée*, soit retirer l'entrée bénévole au dashboard.
- 🟡 **UI non filtrée par accès** : la sidebar montre les 13 panneaux quel que soit le rôle → un bénévole voit des panneaux qui échouent à l'API (incohérence UX, pas une faille).
- 🟠 **Mutation de don ouverte aux bénévoles** (`/api/admin/donations/[id]` en souple) → un bénévole peut changer le statut/la transaction d'un don (financier). À revoir : admin-only ?
- 🟡 i18n éditable par bénévole (textes du site) ; bug marque « sigle (CFM) Admin » (interne, faible impact).

---

## ✅ Audit terminé — périmètre
Public : Accueil, Chrome, S'engager, Contact, Tunnel auth, Pétitions, Live. Portail : 12 écrans. Admin : accès & RBAC + structure.
**Non couvert** (peu de comportement / répétitif) : informationnelles publiques (a-propos, axes, actions, plaidoyer, presse, actualités, légal), et les panneaux admin détaillés un par un.
