# Plan correctif — CFM ASBL

> **Objectif** : porter le site de ~65 % de couverture fonctionnelle réelle à **≥ 97 %**  
> **Base** : audit technique juillet 2026 (parcours HTTP, APIs, code, `PLAN.md`, `WEBDESIGN.md`)  
> **Périmètre** : V1 + V2 + V3 + refonte design — sans app mobile native (reportée V4+)

---

## 1. Définition de la cible 97 %

La couverture est mesurée sur **32 modules fonctionnels** identifiés dans le périmètre V1–V3 + design. Chaque module est noté :

| Score | Signification |
|-------|---------------|
| **0 %** | Absent ou cassé (HTTP 500, parcours impossible) |
| **50 %** | Partiellement implémenté (UI seule, mode démo, i18n incomplet) |
| **80 %** | Fonctionnel en local avec réserves mineures |
| **100 %** | Complet, testé, prêt production |

**Cible 97 %** = 31 modules à ≥ 80 %, dont **28 à 100 %**, et **0 module bloquant (0 %)**.

### Matrice des 32 modules

| # | Module | État actuel (audit) | Cible |
|---|--------|---------------------|-------|
| 1 | Pages publiques statiques (10) | 80 % | 100 % |
| 2 | Routes dynamiques (`[slug]`) | **0 %** (500) | 100 % |
| 3 | Formulaire contact | 80 % | 100 % |
| 4 | Formulaire adhésion V1 | 80 % | 100 % |
| 5 | Formulaire aide confidentielle | 70 % | 95 % |
| 6 | Newsletter | 80 % | 100 % |
| 7 | Admin V1 (contenu + stats) | 70 % | 95 % |
| 8 | Auth admin + rôles bénévole | 80 % | 100 % |
| 9 | Espace membre (inscription, login, reset) | 80 % | 100 % |
| 10 | Tableau de bord membre | 60 % | 90 % |
| 11 | Liens familiaux parent/enfant | 80 % | 100 % |
| 12 | Pétitions (liste + détail + signature) | **20 %** | 100 % |
| 13 | Dons Mobile Money | 60 % (démo) | 95 % |
| 14 | Emails transactionnels | 50 % (log fichier) | 95 % |
| 15 | i18n FR / EN | 60 % | 95 % |
| 16 | i18n Lingala / Swahili | 50 % | 90 % |
| 17 | Live (liste + détail + player) | **20 %** | 95 % |
| 18 | Chat live + modération | **20 %** | 90 % |
| 19 | Sondages live | **20 %** | 90 % |
| 20 | Push notifications PWA | 40 % | 85 % |
| 21 | PWA (manifest, SW, cache) | 70 % | 90 % |
| 22 | Persistance données (PostgreSQL) | 10 % (schéma seul) | 95 % |
| 23 | Sécurité données sensibles | 30 % | 90 % |
| 24 | Espace presse + téléchargements | 30 % | 90 % |
| 25 | Plaidoyer (études, campagnes, actualités) | 60 % | 90 % |
| 26 | Carte actions RDC (26 provinces) | 40 % | 85 % |
| 27 | Médias réels (photos FIKIN, hero) | 40 % (SVG) | 90 % |
| 28 | Animations & design system | 75 % | 95 % |
| 29 | Pages détail actualités | 0 % | 90 % |
| 30 | Transparence donateurs | 40 % | 80 % |
| 31 | Rate limiting & robustesse API | 0 % | 85 % |
| 32 | Déploiement production (VPS + HTTPS) | 20 % | 95 % |

**Score actuel estimé** : ~65 % (moyenne pondérée, modules 2/12/17/18/19 fortement pénalisants).  
**Score cible** : ≥ 97 % après exécution des 8 phases ci-dessous.

---

## 2. Vue d'ensemble des phases

```
Phase 0 — Stabilisation critique     │ 3–5 j    │ Débloquer le site (500 → 200)
Phase 1 — Parcours bloquants         │ 1 sem    │ Pétitions + Live utilisables
Phase 2 — Données & persistance      │ 2 sem    │ PostgreSQL runtime + sécurité
Phase 3 — Complétude V1              │ 1–2 sem  │ Contenu, presse, carte, actualités
Phase 4 — Complétude V2              │ 2 sem    │ Membres, dons, emails, i18n EN
Phase 5 — Complétude V3              │ 2 sem    │ Live, push, chat, i18n LN/SW
Phase 6 — Design & médias            │ 2–3 sem  │ Photos réelles, perfs, Lighthouse
Phase 7 — Sécurité & robustesse      │ 1 sem    │ Rate limit, CSP, webhooks
Phase 8 — Production & validation    │ 1–2 sem  │ VPS, HTTPS, tests finaux 97 %
─────────────────────────────────────────────────────────────────────────────
Total estimé                         │ 12–16 sem│ (~3–4 mois)
```

---

## 3. Phase 0 — Stabilisation critique

**Durée** : 3–5 jours  
**Objectif** : zéro page en HTTP 500 ; `npm run build` sans erreur.

### 3.1 Problème prioritaire

Crash `Cannot find module './vendor-chunks/motion-dom.js'` sur les routes dynamiques et parfois `/axes`, lié à **framer-motion** + layout global (`PageTransition`, `ScrollReveal`).

### 3.2 Tâches

| # | Tâche | Livrable |
|---|-------|----------|
| 0.1 | Purger `.next`, réinstaller dépendances, vérifier compatibilité `framer-motion` / Next.js 15 | Build propre |
| 0.2 | Isoler les composants `framer-motion` : s'assurer que `PageTransition` et `ScrollReveal` sont bien `"use client"` et non importés de façon problématique côté serveur sur routes dynamiques | Routes `[slug]` stables |
| 0.3 | Alternative si 0.1–0.2 insuffisant : downgrade `framer-motion` vers version testée (^11.x) ou retirer `PageTransition` du layout global (garder `ScrollReveal` client-only) | Décision documentée |
| 0.4 | Corriger API pétition : valider `name` + `email` avant `signPetition()` ; retourner **400** si manquant | `POST /api/petitions/[slug]` robuste |
| 0.5 | Script de smoke test : toutes les URLs publiques → 200 (ou 307 attendu) | `scripts/smoke-routes.mjs` |
| 0.6 | `npm run build` + `npm run start` : valider 47 routes en production locale | Build vert |

### 3.3 Critères de validation Phase 0

- [ ] `/petitions/reforme-protection-familles` → **200**
- [ ] `/live/fikin-2025` → **200**
- [ ] `/axes` → **200** (10 requêtes consécutives sans 500)
- [ ] `npm run build` → succès
- [ ] Aucune régression sur les 18 pages statiques

**Couverture après Phase 0** : ~72 %

---

## 4. Phase 1 — Parcours bloquants

**Durée** : 1 semaine  
**Objectif** : parcours pétition et live testables de bout en bout dans le navigateur.

### 4.1 Pétitions

| # | Tâche | Livrable |
|---|-------|----------|
| 1.1 | Tester signature pétition (nom, email, anti-doublon 409) | Parcours OK |
| 1.2 | Ajouter 2ᵉ pétition seed dans `store.json` / `store.seed.json` (cohérence PLAN) | 2 pétitions actives |
| 1.3 | i18n sur page détail pétition + `PetitionSignForm` (FR/EN/LN/SW) | Formulaire multilingue |
| 1.4 | Lier campagnes plaidoyer vers pétition spécifique (slug) au lieu de `/petitions` générique | Liens contextuels |

### 4.2 Live

| # | Tâche | Livrable |
|---|-------|----------|
| 1.5 | Corriger événement seed FIKIN : `youtube_id` valide ou `replay_url` embeddable | Player affiche du contenu |
| 1.6 | Tester chat (POST message, modération pending, approbation admin) | Chat fonctionnel |
| 1.7 | Tester sondage (création admin, vote, anti-doublon cookie) | Sondage fonctionnel |
| 1.8 | Vérifier compteur spectateurs (`incrementViewerCount`) | Métrique affichée |

### 4.3 Médias côté client

| # | Tâche | Livrable |
|---|-------|----------|
| 1.9 | Créer `resolveMediaPathClient()` partagé (fallback `.png` → `.svg`) | Plus d'images cassées sur `/actions` |
| 1.10 | Appliquer le fallback sur tous les composants client utilisant `MEDIA.*.png` | Cohérence visuelle |

### 4.4 Critères de validation Phase 1

- [ ] Signature pétition → compteur +1, message succès
- [ ] Live replay ou embed visible sur `/live/fikin-2025`
- [ ] Message chat posté pendant statut `live` → visible ou en modération
- [ ] Vote sondage enregistré
- [ ] Aucune image 404 dans la console navigateur (pages Actions, Accueil)

**Couverture après Phase 1** : ~78 %

---

## 5. Phase 2 — Données & persistance

**Durée** : 2 semaines  
**Objectif** : fin du `store.json` en runtime production ; données sensibles protégées.

### 5.1 PostgreSQL runtime

| # | Tâche | Livrable |
|---|-------|----------|
| 2.1 | Implémenter adaptateur BDD (`lib/db-adapter.ts`) : interface commune JSON / PostgreSQL | Abstraction données |
| 2.2 | Basculer `getStore()` / `updateStore()` vers PostgreSQL si `DATABASE_URL` défini | Runtime dual-mode |
| 2.3 | Script import `store.json` → PostgreSQL (`scripts/import-to-postgres.mjs`) | Migration zéro perte |
| 2.4 | Tests régression : tous les modules CRUD (admin, membres, live, pétitions) | Suite tests données |
| 2.5 | Documenter procédure bascule dans `MIGRATION-POSTGRES.md` (mise à jour) | Guide opérationnel |

### 5.2 Sécurité données sensibles

| # | Tâche | Livrable |
|---|-------|----------|
| 2.6 | Chiffrer champs sensibles `help_requests` (description, téléphone) au repos (AES-256-GCM + clé `DATA_ENCRYPTION_KEY`) | Conformité promesse V1 |
| 2.7 | Déchiffrement uniquement côté admin authentifié | Accès restreint |
| 2.8 | Lier `help_requests.user_id` à la soumission si membre connecté | Suivi dossier fiable |
| 2.9 | Sauvegarde automatique quotidienne (script cron VPS) | `scripts/backup-db.sh` |

### 5.3 Critères de validation Phase 2

- [ ] Site fonctionne avec `DATABASE_URL` (PostgreSQL) **et** sans (JSON dev)
- [ ] Import des données seed sans perte
- [ ] Demande d'aide lisible admin, illisible en clair dans la BDD
- [ ] Membre connecté voit sa demande d'aide dans le tableau de bord immédiatement

**Couverture après Phase 2** : ~83 %

---

## 6. Phase 3 — Complétude V1

**Durée** : 1–2 semaines  
**Objectif** : livrer le périmètre V1 documenté à 100 %.

### 6.1 Contenu & navigation

| # | Tâche | Livrable |
|---|-------|----------|
| 3.1 | Pages détail actualités `/actualites/[slug]` | Articles cliquables depuis accueil/plaidoyer |
| 3.2 | Téléchargement PDF études (`file_url` + upload admin) | Bouton « Télécharger le rapport » |
| 3.3 | Téléchargement communiqués presse (`file_url`) | PDF presse fonctionnel |
| 3.4 | Dossier de presse PDF (remplacer bouton disabled sur `/presse`) | Kit presse téléchargeable |
| 3.5 | Supprimer doublon `NAV_LINKS` pétitions dans `constants.ts` | Code propre |

### 6.2 Carte & transparence

| # | Tâche | Livrable |
|---|-------|----------|
| 3.6 | Carte RDC : coordonnées SVG pour les **26 provinces** (points cliquables) | Carte réellement nationale |
| 3.7 | Section transparence : tableau récapitulatif dons anonymisés (montants agrégés, pas de données perso) | Transparence publique |
| 3.8 | Remplacer `SITE.phone` placeholder par numéro réel | Contact crédible |

### 6.3 Admin V1

| # | Tâche | Livrable |
|---|-------|----------|
| 3.9 | Upload PDF études / presse dans admin | CRUD fichiers |
| 3.10 | Gestion `cover_image` actualités via admin design | Couvertures personnalisées |

### 6.4 Critères de validation Phase 3

- [ ] Clic actualité accueil → page détail complète
- [ ] Au moins 1 étude avec PDF téléchargeable
- [ ] Dossier presse PDF téléchargeable
- [ ] Carte : les 26 provinces listées, provinces avec actions cliquables
- [ ] 10/10 pages publiques V1 à 100 %

**Couverture après Phase 3** : ~87 %

---

## 7. Phase 4 — Complétude V2

**Durée** : 2 semaines  
**Objectif** : espace membre et paiements prêts production.

### 7.1 Espace membre

| # | Tâche | Livrable |
|---|-------|----------|
| 4.1 | Page édition profil membre (nom, téléphone, province) | `/membre/profil` |
| 4.2 | i18n complète : inscription, connexion, dashboard, formulaires membre | EN + FR minimum |
| 4.3 | i18n sections non traduites de `/s-engager` (adhésion, transparence, partenariat) | Page entièrement traduite |
| 4.4 | Vérifier parcours bénévole → admin limité (pas de suppression contenu) | Rôle conforme |
| 4.5 | Export CSV pétitions : test UTF-8 BOM avec caractères accentués | Export validé |

### 7.2 Paiements & emails

| # | Tâche | Livrable |
|---|-------|----------|
| 4.6 | Configurer et tester PayDunya en `MOBILE_MONEY_MODE=production` | 1 transaction réelle test |
| 4.7 | Webhook PayDunya : améliorer vérification signature (HMAC, pas simple égalité master key) | Sécurité webhook |
| 4.8 | Configurer SMTP (Brevo/Resend/Zoho) : inscription, activation, aide, don, reset password | Emails réels reçus |
| 4.9 | Reçu donateur par email en production | Parcours don complet |
| 4.10 | Retirer ou conditionner message « mode démo » sur `DonationForm` selon `MOBILE_MONEY_MODE` | UX production |

### 7.3 Critères de validation Phase 4

- [ ] Inscription → email reçu → admin active → email activation → dashboard
- [ ] Reset password : email → lien → nouveau mot de passe OK
- [ ] Don production : redirection PayDunya → webhook → statut `completed` → reçu email
- [ ] Interface membre utilisable en anglais (80 %+ des libellés)

**Couverture après Phase 4** : ~91 %

---

## 8. Phase 5 — Complétude V3

**Durée** : 2 semaines  
**Objectif** : mobilisation live + push + multilingue opérationnels en HTTPS.

### 8.1 Live & engagement

| # | Tâche | Livrable |
|---|-------|----------|
| 5.1 | Parcours admin complet : créer événement → démarrer live → chat → sondage → terminer → replay | Runbook live |
| 5.2 | Notification push automatique au démarrage live (thème `lives`) | Push déclenché |
| 5.3 | Optionnel mais recommandé : WebSocket ou SSE pour chat (remplacer polling 3 s) | Latence < 1 s |
| 5.4 | Bannissement session/IP chat (liste noire admin) | Modération renforcée |
| 5.5 | i18n labels chat/sondages sur toutes les langues | LN/SW complets |

### 8.2 Push & PWA

| # | Tâche | Livrable |
|---|-------|----------|
| 5.6 | Générer clés VAPID (`scripts/generate-vapid.mjs`) et configurer `.env` production | Clés déployées |
| 5.7 | Tester abonnement push sur HTTPS (staging puis prod) | Bouton « Alertes live » fonctionnel |
| 5.8 | Push thèmes `campaigns` et `help` (mise à jour dossier) | 3 thèmes actifs |
| 5.9 | Enrichir cache PWA : pages pétitions, membre, axes | Hors-ligne partiel |

### 8.3 i18n LN / SW

| # | Tâche | Livrable |
|---|-------|----------|
| 5.10 | Traduire pages restantes : axes, actions, plaidoyer, presse, légales, pétitions | 90 % contenu LN/SW |
| 5.11 | Traduire tous les formulaires (contact, aide, adhésion, don) | Formulaires multilingues |
| 5.12 | Revue par locuteurs natifs (ou validateur communautaire) | Qualité linguistique |

### 8.4 Critères de validation Phase 5

- [ ] 1 live test avec 3+ participants, chat et sondage actifs
- [ ] 1 abonné push reçoit notification au démarrage live
- [ ] PWA installable sur Android Chrome (HTTPS)
- [ ] Basculer LN/SW : aucun débordement layout sur mobile 320px
- [ ] Modules 17–21 ≥ 85 %

**Couverture après Phase 5** : ~94 %

---

## 9. Phase 6 — Design & médias

**Durée** : 2–3 semaines  
**Objectif** : alignement `WEBDESIGN.md` phases D1–D5.

### 9.1 Banque de médias

| # | Tâche | Livrable |
|---|-------|----------|
| 6.1 | Importer photos FIKIN réelles (`npm run import-media` ou shooting) | 15–20 photos WebP/PNG |
| 6.2 | Remplacer SVG placeholders hero, mission, axes, témoignages | Médias authentiques |
| 6.3 | Installer `sharp` : compression à l'upload admin | Images < 200 Ko |
| 6.4 | Vidéo hero optionnelle (MP4 < 3 Mo, loop FIKIN) | `VideoBackground` actif |
| 6.5 | Floutage automatique portrait si témoignage `anonymous === 1` | Protection anonymat |

### 9.2 Performance & accessibilité

| # | Tâche | Livrable |
|---|-------|----------|
| 6.6 | Audit Lighthouse mobile (simulation 3G) | Rapport screenshot |
| 6.7 | Cible : Performance ≥ 80, LCP < 2,5 s, Accessibilité ≥ 90 | Optimisations appliquées |
| 6.8 | Lazy load images below-fold, `sizes` optimisés | Poids accueil < 800 Ko |
| 6.9 | Test `prefers-reduced-motion` sur toutes animations | Accessibilité motion |
| 6.10 | Test cross-browser : Chrome, Firefox, Safari, Edge mobile | Matrice compatibilité |

### 9.3 Critères de validation Phase 6

- [ ] Hero accueil avec photo ou vidéo FIKIN réelle
- [ ] Lighthouse mobile Performance ≥ 80
- [ ] 0 image placeholder SVG sur les 5 pages design clés (accueil, à propos, axes, live, actions)
- [ ] Témoignage anonyme : visage flouté

**Couverture après Phase 6** : ~96 %

---

## 10. Phase 7 — Sécurité & robustesse

**Durée** : 1 semaine  
**Objectif** : durcissement production sans régression fonctionnelle.

### 10.1 Tâches

| # | Tâche | Livrable |
|---|-------|----------|
| 7.1 | Rate limiting APIs publiques (contact, aide, newsletter, chat, pétitions) | Middleware ou edge rules |
| 7.2 | CSP headers production (Nginx / `next.config.ts`) | Politique stricte |
| 7.3 | Logs d'accès admin aux données sensibles (help_requests déchiffrées) | Audit trail |
| 7.4 | Rotation secrets documentée (`SESSION_SECRET`, `DATA_ENCRYPTION_KEY`) | Procédure ops |
| 7.5 | Scan dépendances (`npm audit`) + correction vulnérabilités critiques | Rapport sécurité |
| 7.6 | Valider protection CSRF sur formulaires state-changing | Sessions sécurisées |

### 10.2 Critères de validation Phase 7

- [ ] 100 requêtes/min sur `/api/contact` → 429
- [ ] Headers CSP présents en production
- [ ] `npm audit` : 0 critique
- [ ] Modules 23 et 31 ≥ 85 %

**Couverture après Phase 7** : ~97 %

---

## 11. Phase 8 — Production & validation finale

**Durée** : 1–2 semaines  
**Objectif** : cfmasbl.com en production, score 97 % certifié.

### 11.1 Déploiement VPS (pas Netlify pour prod)

| # | Tâche | Livrable |
|---|-------|----------|
| 8.1 | VPS Linux : Node 20, PM2, Nginx reverse proxy | Infra opérationnelle |
| 8.2 | PostgreSQL 15 sur VPS | BDD production |
| 8.3 | Let's Encrypt + Cloudflare CDN | HTTPS actif |
| 8.4 | Variables `.env` production complètes | Checklist déployée |
| 8.5 | Import données finales + backup initial | Données prod |
| 8.6 | Conserver Netlify uniquement pour démo visuelle (readonly) | `CFM_DEMO_READONLY` |

### 11.2 Matrice de tests finaux (97 %)

Exécuter **tous** les parcours ci-dessous sur **https://cfmasbl.com** :

| # | Parcours | Résultat attendu |
|---|----------|------------------|
| T1 | 18 pages publiques + 2 dynamiques | HTTP 200 |
| T2 | Inscription membre famille → validation admin → dashboard | Compte actif |
| T3 | Lien parent → enfant → approbation | Lien `approved` |
| T4 | Signature pétition + export CSV admin | Signature + export OK |
| T5 | Don Mobile Money production | Transaction + reçu email |
| T6 | Demande aide mineur sans consentement → rejet 400 | Validation OK |
| T7 | Demande aide adulte → email reçu → update admin → notification membre | Dossier suivi |
| T8 | Live : créer → démarrer → chat → sondage → push → replay | Événement complet |
| T9 | i18n : 4 langues sur accueil, contact, membre | Pas de régression |
| T10 | PWA install + push sur Android | Notification reçue |
| T11 | Admin : CRUD actualité + upload image + PDF étude | Persistance PostgreSQL |
| T12 | Lighthouse mobile 3G | Performance ≥ 80 |
| T13 | Sauvegarde + restauration BDD test | Zéro perte |

### 11.3 Critères de clôture projet

- [ ] **31/32 modules ≥ 80 %** (app native optionnelle exclue volontairement)
- [ ] **28/32 modules à 100 %**
- [ ] **0 module à 0 %**
- [ ] Score global ≥ **97 %**
- [ ] `PLAN.md` mis à jour avec statut « Production validée »

---

## 12. Calendrier consolidé

| Phase | Semaines | Cumul | Jalon |
|-------|----------|-------|-------|
| 0 — Stabilisation | S1 | S1 | Site sans 500 |
| 1 — Parcours bloquants | S2 | S2 | Pétitions + Live OK |
| 2 — PostgreSQL | S3–S4 | S4 | Données production |
| 3 — V1 complet | S5–S6 | S6 | Contenu & presse |
| 4 — V2 complet | S7–S8 | S8 | Membres + paiements |
| 5 — V3 complet | S9–S10 | S10 | Live + push + i18n |
| 6 — Design | S11–S13 | S13 | Médias + Lighthouse |
| 7 — Sécurité | S14 | S14 | Durcissement |
| 8 — Production | S15–S16 | S16 | **97 % validé** |

---

## 13. Variables d'environnement — checklist production

| Variable | Phase requise | Obligatoire prod |
|----------|---------------|------------------|
| `ADMIN_PASSWORD` | 0 | Oui |
| `SESSION_SECRET` | 0 | Oui |
| `NEXT_PUBLIC_SITE_URL` | 4 | Oui |
| `DATABASE_URL` | 2 | Oui |
| `DATA_ENCRYPTION_KEY` | 2 | Oui |
| `SMTP_*` | 4 | Oui |
| `MOBILE_MONEY_MODE=production` | 4 | Oui |
| `PAYDUNYA_*` | 4 | Oui |
| `VAPID_*` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | 5 | Oui |
| `VAPID_SUBJECT` | 5 | Oui |

---

## 14. Hors périmètre (3 % restants — V4+)

Ces éléments sont **volontairement exclus** de la cible 97 % :

| Fonctionnalité | Raison |
|----------------|--------|
| Application mobile native (React Native / Flutter) | PWA suffisante V3 |
| Streaming Mux / LiveKit professionnel | YouTube + stream URL suffisants à 95 % |
| SMS fallback notifications | Coût infra, push prioritaire |
| Flutterwave (doublon PayDunya) | Une passerelle suffit |
| Traduction 100 % certifiée natifs sur tout le site | 90 % LN/SW couvre la cible |
| Analytics avancés / BI admin | Reporté V4 |

---

## 15. Suivi d'avancement

Mettre à jour ce tableau à chaque fin de phase :

| Phase | Statut | Date début | Date fin | Couverture mesurée |
|-------|--------|------------|----------|-------------------|
| 0 — Stabilisation | ✅ Fait | 2026-07-01 | 2026-07-01 | ~72 % |
| 1 — Parcours bloquants | ✅ Fait | 2026-07-01 | 2026-07-01 | ~78 % |
| 2 — PostgreSQL | ✅ Fait | 2026-07-01 | 2026-07-01 | ~83 % |
| 3 — V1 complet | ✅ Fait | 2026-07-01 | 2026-07-01 | ~87 % |
| 4 — V2 complet | ✅ Fait | 2026-07-01 | 2026-07-01 | ~91 % |
| 5 — V3 complet | 🟡 Partiel | 2026-07-01 | — | ~93 % |
| 6 — Design | 🟡 Partiel | 2026-07-01 | — | ~94 % |
| 7 — Sécurité | ✅ Fait | 2026-07-01 | 2026-07-01 | ~96 % |
| 8 — Production | ⏳ À faire | | | Déploiement VPS manuel |

---

*Document généré juillet 2026 — plan correctif CFM ASBL vers 97 % de couverture fonctionnelle.*

---

## 16. Analyse du tableau de suivi d'avancement (section 15)

### 16.1 Lecture de l'état actuel

| Phase | Statut déclaré | Couverture | Écart réel estimé |
|-------|----------------|------------|-------------------|
| 0 — Stabilisation | ✅ Fait | ~72 % | **~95 %** — objectifs atteints ; smoke test à rejouer après chaque grosse livraison |
| 1 — Parcours bloquants | ✅ Fait | ~78 % | **~90 %** — pétitions/live débloqués ; chat/sondage non poussés à 90 % (reliés phase 5) |
| 2 — PostgreSQL | ✅ Fait | ~83 % | **~85 %** — adaptateur + chiffrement OK ; hydratation PG au démarrage encore manuelle (`hydrate-from-postgres.mjs`) |
| 3 — V1 complet | ✅ Fait | ~87 % | **~88 %** — actualités, carte, transparence OK ; upload admin PDF/couvertures et `SITE.phone` réel manquants |
| 4 — V2 complet | ✅ Fait | ~91 % | **~82 %** — profil membre + i18n UI OK ; **SMTP production**, **PayDunya réel** et **formulaires publics i18n** non finalisés |
| 5 — V3 complet | 🟡 Partiel | ~93 % | **Hors périmètre** du présent plan |
| 6 — Design | 🟡 Partiel | ~94 % | **Hors périmètre** du présent plan |
| 7 — Sécurité | ✅ Fait | ~96 % | **~75 %** — rate limiting OK ; **CSP production**, **audit trail admin**, **CSRF**, **npm audit** non livrés |
| 8 — Production | ⏳ À faire | — | **Hors périmètre** du présent plan |

**Constat** : le tableau de suivi surestime la complétude des phases 4 et 7. Le score global réel hors phases 5/6/8 est estimé à **~88–90 %** sur les 16 modules concernés (voir §16.2), et non ~96 %.

### 16.2 Modules encore sous la cible (hors phases 5, 6, 8)

Les modules suivants sont **dans le périmètre 100 %** de ce plan complémentaire :

| # | Module | Score actuel estimé | Cible plan | Phase d'origine |
|---|--------|---------------------|------------|-----------------|
| 1 | Pages publiques statiques | 85 % | 100 % | 3–4 |
| 3 | Formulaire contact | 75 % | 100 % | 4 |
| 4 | Formulaire adhésion V1 | 75 % | 100 % | 4 |
| 5 | Formulaire aide confidentielle | 75 % | 95 % | 2–4 |
| 6 | Newsletter | 80 % | 100 % | 4 |
| 7 | Admin V1 (contenu + stats) | 70 % | 95 % | 3 |
| 10 | Tableau de bord membre | 75 % | 90 % | 4 |
| 13 | Dons Mobile Money | 65 % | 95 % | 4 |
| 14 | Emails transactionnels | 40 % | 95 % | 4 |
| 15 | i18n FR / EN | 85 % | 95 % | 4 |
| 16 | i18n Lingala / Swahili | 70 % | 90 % | 4* |
| 22 | Persistance PostgreSQL | 75 % | 95 % | 2 |
| 23 | Sécurité données sensibles | 70 % | 90 % | 2–7 |
| 24 | Espace presse + téléchargements | 60 % | 90 % | 3 |
| 25 | Plaidoyer (études, campagnes) | 75 % | 90 % | 3 |
| 31 | Rate limiting & robustesse API | 60 % | 85 % | 7 |

\* *Module 16 : couverture LN/SW des **pages et formulaires publics** (hors live/chat/push) — sans revue native ni tâches phase 5.*

**Modules exclus volontairement** (inchangés, liés phases 5, 6 ou 8) :

| # | Module | Score actuel | Raison d'exclusion |
|---|--------|--------------|-------------------|
| 17 | Live (liste + détail + player) | ~80 % | Phase 5 — runbook, SSE, modération avancée |
| 18 | Chat live + modération | ~50 % | Phase 5 |
| 19 | Sondages live | ~50 % | Phase 5 |
| 20 | Push notifications PWA | ~40 % | Phase 5 |
| 21 | PWA (manifest, SW, cache) | ~70 % | Phase 5 — enrichissement cache |
| 27 | Médias réels (photos FIKIN) | ~40 % | Phase 6 |
| 28 | Animations & design system | ~75 % | Phase 6 |
| 32 | Déploiement production VPS | ~20 % | Phase 8 |

**Modules déjà à la cible** (pas d'action requise dans ce plan) : 2, 8, 9, 11, 12, 26, 29, 30.

### 16.3 Score projeté après exécution du plan

| Périmètre | Modules | Score moyen cible |
|-----------|---------|-------------------|
| Modules du plan (16 modules) | 1, 3–7, 10, 13–16, 22–25, 31 | **≥ 95 %** chacun |
| Modules exclus (8 modules) | 17–21, 27–28, 32 | Inchangés (~55 % moy.) |
| Modules stables (8 modules) | 2, 8, 9, 11, 12, 26, 29, 30 | **≥ 95 %** |

**Score global pondéré projeté** : **~92–94 %** sur les 32 modules — soit **100 % du périmètre exécutable** hors phases 5, 6 et 8.

---

## 17. Plan complémentaire — 100 % hors phases 5, 6 et 8

> **Objectif** : clôturer toutes les tâches résiduelles des phases 0 à 4 et 7, sans toucher au live avancé, au push, aux médias FIKIN, ni au déploiement VPS.  
> **Durée estimée** : **4 à 6 semaines** (1 développeur à temps plein).  
> **Ordre** : 5 vagues séquentielles, chaque vague se termine par `npm run lint`, `npm run typecheck`, `npm run build` et `npm run smoke`.

---

### Vague A — i18n & formulaires publics (semaine 1)

**Objectif** : modules 1, 3, 4, 5, 6, 15, 16 → cible atteinte.

| # | Tâche | Modules | Livrable | Critère de validation |
|---|-------|---------|----------|----------------------|
| A.1 | Traduire `ContactForm` + formulaire aide (`HelpRequestForm` si séparé) via `useTranslations()` / clés `i18n-supplement` | 3, 5, 15 | 4 langues sur `/contact` | Basculer EN/LN/SW : labels, placeholders, messages succès/erreur traduits |
| A.2 | Traduire `MembershipForm` (adhésion V1 rapide) | 4, 15 | Formulaire multilingue | Mêmes champs que `MemberRegisterForm` couverts |
| A.3 | Traduire `NewsletterForm` (footer + accueil) | 6, 15 | Inscription newsletter i18n | Message succès/erreur dans les 4 langues |
| A.4 | Traduire `FamilyLinkManager` + libellés statuts dashboard (pending, approved…) | 10, 15 | Espace membre cohérent | Dashboard entièrement lisible EN |
| A.5 | Compléter chaînes résiduelles accueil (`Tout voir`, sous-titre axes, campagnes) | 1, 15 | Accueil 100 % i18n | Aucune chaîne FR hardcodée sur `/` en mode EN |
| A.6 | LN/SW : traduire formulaires publics (contact, aide, adhésion, newsletter) — contenu fonctionnel, pas revue native | 16 | Formulaires LN/SW | Basculer LN/SW : formulaires utilisables sans FR résiduel |
| A.7 | Pages légales : traduire **titres de sections** + métadonnées EN ; corps FR conservé pour LN/SW (acceptable V3) | 1, 15 | `/mentions-legales`, `/confidentialite` | Titre + h2 principaux traduits en EN |

**Jalon Vague A** : modules 1, 3, 4, 5, 6, 15 à **≥ 95 %** ; module 16 à **≥ 85 %**.

---

### Vague B — Admin V1, contenu & presse (semaine 2)

**Objectif** : modules 7, 24, 25 → cible atteinte.

| # | Tâche | Modules | Livrable | Critère de validation |
|---|-------|---------|----------|----------------------|
| B.1 | Admin : upload PDF pour études (`file_url`) et communiqués presse | 7, 25 | Interface upload + stockage `public/media/` | Admin uploade PDF → bouton téléchargement actif sur plaidoyer/presse |
| B.2 | Admin : upload `cover_image` actualités (remplacer placeholder) | 7, 25 | CRUD couvertures | Nouvelle actualité avec image personnalisée visible accueil + détail |
| B.3 | Déposer `public/media/presse/dossier-presse.pdf` (contenu réel ou placeholder documenté) | 24 | Kit presse téléchargeable | `/presse` : lien PDF actif, pas de message « déposez le fichier » |
| B.4 | Vérifier `file_url` sur toutes les études seed ; compléter si manquant | 25 | ≥ 1 étude PDF | Téléchargement rapport depuis `/plaidoyer` |
| B.5 | Admin stats : vérifier compteurs (membres, dons, pétitions, demandes aide) et corriger agrégations si écart | 7 | Dashboard admin fiable | Chiffres admin = données `store` / PostgreSQL |
| B.6 | Remplacer `SITE.phone` par numéro réel dans `constants.ts` + `.env.example` documenté | 1, 24 | Contact crédible | Footer + `/contact` affichent le bon numéro |
| B.7 | Export CSV pétitions : test UTF-8 BOM + caractères accentués (tâche 4.5 non validée) | 7 | Export admin validé | CSV ouvre correctement dans Excel FR avec accents |

**Jalon Vague B** : modules 7, 24, 25 à **≥ 90 %**.

---

### Vague C — PostgreSQL, emails & paiements (semaines 3–4)

**Objectif** : modules 13, 14, 22, 23 → cible atteinte.

| # | Tâche | Modules | Livrable | Critère de validation |
|---|-------|---------|----------|----------------------|
| C.1 | Documenter et tester bascule dual-mode : `DATABASE_URL` défini → toutes écritures via `db-adapter` ; script `import-to-postgres.mjs` sur données réelles | 22 | Guide + test | CRUD admin/membre/pétition/don persiste en PostgreSQL après redémarrage |
| C.2 | Optionnel recommandé : hydratation automatique `store.json` ← PostgreSQL au boot serveur (ou script pre-dev documenté dans `package.json`) | 22 | Procédure sans ambiguïté | Développeur suit README : données PG visibles sans étape manuelle oubliée |
| C.3 | Configurer SMTP production (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) — Brevo, Resend ou Zoho | 14 | `.env.example` + test | Email reçu sur boîte réelle |
| C.4 | Emails transactionnels à valider un par un : inscription, activation compte, reset password, accusé demande aide, reçu don | 14 | 5 templates testés | Chaque parcours déclenche l'email attendu (ou log explicite si mode dev) |
| C.5 | Configurer PayDunya `MOBILE_MONEY_MODE=production` + clés sandbox puis prod | 13 | Transaction test | Redirection PayDunya → webhook → statut `completed` en BDD |
| C.6 | Tester webhook signature HMAC (déjà implémenté) avec payload PayDunya réel | 13, 23 | Webhook sécurisé | Requête sans signature valide → 401 |
| C.7 | Vérifier déchiffrement `help_requests` : admin authentifié lit en clair ; export JSON/BDD montre chiffré | 23 | Conformité promesse | Champ `description` illisible en brut dans PostgreSQL |
| C.8 | Lier automatiquement `help_requests.user_id` si soumission par membre connecté (si pas déjà testé bout en bout) | 5, 10, 23 | Suivi dossier | Membre voit sa demande dans le dashboard immédiatement |
| C.9 | Script `backup-db.sh` : tester restauration sur instance locale | 22 | Backup opérationnel | Restauration sans perte de données |

**Jalon Vague C** : modules 13, 14, 22, 23 à **≥ 90 %** ; module 5 à **≥ 95 %**.

---

### Vague D — Sécurité résiduelle phase 7 (semaine 5)

**Objectif** : module 31 → 85 %+ ; compléter phase 7 réelle.

| # | Tâche | Modules | Livrable | Critère de validation |
|---|-------|---------|----------|----------------------|
| D.1 | Étendre rate limiting à toutes les APIs formulaires : `/api/contact`, `/api/help`, `/api/newsletter`, `/api/membership`, `/api/donations`, `/api/petitions/*` | 31 | Couverture uniforme | 30+ req/min → HTTP 429 sur chaque endpoint |
| D.2 | Ajouter en-têtes CSP en production via `next.config.ts` headers ou doc Nginx | 31 | CSP documentée | Headers visibles en `npm run start` ou config Nginx fournie |
| D.3 | Journal d'audit : log structuré quand admin consulte/déchiffre une `help_request` | 23, 31 | `audit.log` ou table `audit_events` | Action admin tracée avec horodatage + user |
| D.4 | Exécuter `npm audit` ; corriger vulnérabilités **critiques** et **hautes** | 31 | Rapport sécurité | 0 critique à la clôture |
| D.5 | Valider protection CSRF sur routes session (login admin, login membre, PATCH profil) | 31 | Tokens ou SameSite strict | Requête cross-origin forgée rejetée |
| D.6 | Documenter procédure rotation `SESSION_SECRET` et `DATA_ENCRYPTION_KEY` dans `MIGRATION-POSTGRES.md` ou `OPS.md` | 23 | Procédure ops | Document relu et daté |
| D.7 | Rejouer `scripts/smoke-routes.mjs` + checklist Phase 0 après durcissement | 31 | Non-régression | 0 route publique en 500 |

**Jalon Vague D** : module 31 à **≥ 85 %** ; phase 7 réellement **✅ Fait**.

---

### Vague E — Validation transversale & clôture (semaine 6)

**Objectif** : certifier le 100 % du périmètre hors 5/6/8.

| # | Tâche | Livrable |
|---|-------|----------|
| E.1 | Matrice de tests manuels (dérivée §11.2, **sans** T8 live complet, T10 PWA, T12 Lighthouse, T13 VPS) | 10 parcours validés en local/staging |
| E.2 | Mettre à jour tableau §15 : phases 4 et 7 avec scores réels ; ajouter ligne « Plan complémentaire » | Suivi à jour |
| E.3 | Mettre à jour `PLAN.md` : statut « Prêt staging » (pas production VPS) | Documentation alignée |
| E.4 | Revue finale : aucun module du §16.2 sous sa cible | Checklist signée |

#### Parcours de validation Vague E (staging local ou preview HTTPS)

| # | Parcours | Résultat attendu |
|---|----------|------------------|
| V1 | 10 pages statiques + 4 dynamiques (`petitions`, `live`, `actualites`, `membre`) | HTTP 200 |
| V2 | Contact EN + aide FR + newsletter LN | Formulaires multilingues OK |
| V3 | Inscription → email → activation admin → dashboard | Compte actif |
| V4 | Don démo **ou** PayDunya sandbox | Statut `completed` + email reçu |
| V5 | Admin upload PDF étude + actualité image | Fichiers servis en public |
| V6 | PostgreSQL : redémarrage → données persistées | Zéro perte |
| V7 | Rate limit : 35 POST `/api/contact` | 429 après seuil |
| V8 | i18n : 4 langues sur accueil, contact, s-engager, membre | Pas de régression layout 320px |
| V9 | Export CSV pétition avec nom « François Müller » | UTF-8 BOM OK |
| V10 | Demande aide membre connecté → visible dashboard | `user_id` lié |

---

## 18. Synthèse calendrier plan complémentaire

| Vague | Semaine | Modules principaux | Jalon |
|-------|---------|-------------------|-------|
| A — i18n & formulaires | S1 | 1, 3–6, 15–16 | UI publique multilingue |
| B — Admin & contenu | S2 | 7, 24–25 | PDF, images, stats admin |
| C — Données & paiements | S3–S4 | 5, 10, 13–14, 22–23 | SMTP + PayDunya + PG fiable |
| D — Sécurité phase 7 | S5 | 23, 31 | CSP, audit, CSRF, audit npm |
| E — Validation | S6 | Tous §16.2 | **100 % périmètre hors 5/6/8** |

---

## 19. Critères de clôture du plan complémentaire

Le plan est **terminé** lorsque :

- [ ] Les **16 modules** listés en §16.2 atteignent leur cible individuelle
- [ ] Les **8 modules exclus** (§16.2) restent documentés sans régression
- [ ] `npm run build`, `npm run lint`, `npm run typecheck`, `npm run smoke` passent sans erreur
- [ ] Les **10 parcours V1–V10** (§17 Vague E) sont validés
- [ ] Le tableau §15 est mis à jour avec une ligne :

| Phase / Plan | Statut | Couverture mesurée |
|--------------|--------|-------------------|
| Plan complémentaire (hors 5/6/8) | ✅ Fait | **~92–94 %** global / **100 %** périmètre exécuté |

---

## 20. Dépendances & prérequis opérationnels

| Prérequis | Vague | Responsable |
|-----------|-------|-------------|
| Compte SMTP (Brevo/Resend/Zoho) | C | Admin CFM |
| Compte PayDunya sandbox + prod | C | Admin CFM |
| Numéro téléphone officiel CFM | B | Admin CFM |
| Fichier `dossier-presse.pdf` | B | Équipe communication |
| Instance PostgreSQL locale ou Docker | C | Développeur |
| PDF études existants | B | Équipe plaidoyer |

**Sans ces prérequis**, les modules 13, 14 et 24 plafonnent à ~80 % malgré le code prêt — le plan doit être exécuté dès que les accès sont disponibles.

---

*Ajout juillet 2026 — plan complémentaire 100 % hors phases 5, 6 et 8.*

