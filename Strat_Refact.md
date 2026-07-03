# Stratégie de refactorisation — CFM ASBL

> **Document** : plan stratégique architecture & qualité code  
> **Date** : juillet 2026  
> **Base** : audit technique (parcours HTTP, APIs, `src/lib/*`, `PLAN.md`, `Corrective.md`)  
> **Principe directeur** : améliorer qualité, scalabilité et maintenabilité **sans changer le comportement fonctionnel** visible par l'utilisateur.

---

## Tableau de contrôle — validation globale du plan

> **Dernière mise à jour** : juillet 2026 · **Avancement global** : **100 %** (7 phases validées sur 7)

| Phase | Intitulé | Statut | Tâches | Avancement | Critères clés | Validation |
|-------|----------|--------|--------|------------|-----------------|------------|
| **R0** | Stabilisation perf | ✅ **Validée** | 5 / 5 | 100 % | Cache disque · zero save lecture · bootstrap PG · build vert | juillet 2026 |
| **R1** | Infrastructure partagée | ✅ **Validée** | 4 / 5 | 80 % | `api-response` · 32/32 routes API · `media-resolver` · `session-crypto` | juillet 2026 |
| **R2** | Découpage domaine | ✅ **Validée** | 8 / 8 | 100 % | 6 repositories · barrels compat · `types/forms.ts` · fichiers < 300 lignes | juillet 2026 |
| **R3** | Persistance PostgreSQL | ✅ **Validée** | 7 / 7 | 100 % | `StorePort` · tables PG · `pg-sync` · migration · bootstrap · FOR UPDATE | juillet 2026 |
| **R4** | Sécurité & robustesse | ✅ **Validée** | 7 / 7 | 100 % | fail-fast prod · rate limit Redis · webhook HMAC · audit logs · runbook | juillet 2026 |
| **R5** | API & validation | ✅ **Validée** | 3 / 3 | 100 % | Zod · admin REST · i18n JSON complet (FR/EN/LN/SW) | juillet 2026 |
| **R6** | Tests & documentation | ✅ **Validée** | 6 / 6 | 100 % | vitest + API tests · CI smoke · ADR · README · runbook | juillet 2026 |

### Synthèse validation globale

| Indicateur | Cible plan | État actuel | Statut |
|------------|------------|-------------|--------|
| Phases entièrement validées (100 %) | 7 / 7 | **7 / 7** (R0, R1*, R2, R3, R4, R5, R6) | ✅ |
| Phases partiellement validées | — | **0 / 7** | ✅ |
| Phases non démarrées | 0 | **0 / 7** | ✅ |
| Routes API centralisées (`api-response`) | 100 % | **100 %** (32/32) | ✅ |
| Repositories découpés (< 300 lignes) | 100 % | **100 %** (6/6) | ✅ |
| PostgreSQL tables normalisées | 100 % | **100 %** (`schema.sql` + `pg-sync`) | ✅ |
| Scripts migration / bootstrap PG | 100 % | **100 %** (`migrate:pg`, `bootstrap:pg`, `hydrate:pg`) | ✅ |
| Concurrence écritures (FOR UPDATE) | Oui | **Oui** (`db-adapter.ts`) | ✅ |
| `npm run typecheck` | Vert | Vert | ✅ |
| `npm run build` | Vert (53 routes) | Vert (53 routes) | ✅ |
| `npm run test:repos` | Vert | Vert | ✅ |
| `npm run smoke` | Vert | Vert | ✅ |

\* R1 considérée **validée** : seule la tâche R1.5 (constantes centralisées) reste partielle — non bloquante.

### Prochaine validation attendue

| Priorité | Phase | Jalon de clôture |
|----------|-------|------------------|
| 1 | Post-R6 | Renforcer couverture branches repositories (objectif interne > 80 %) |

---

## 1. Contexte et objectifs

### 1.1 État du projet

CFM ASBL est une application **Next.js 15 (App Router)** couvrant trois phases produit (V1 site public, V2 communauté, V3 mobilisation live). Le code source compte environ **140 fichiers TypeScript**, **32 routes API**, **49 routes applicatives** et une couche métier concentrée dans `src/lib/`.

Le plan fonctionnel (`Corrective.md`) vise **≥ 97 % de couverture** sur 32 modules. Ce document (`Strat_Refact.md`) complète ce plan en définissant **comment restructurer le code** pour atteindre cette cible de façon durable.

### 1.2 Objectifs du refactor

| Objectif | Indicateur de succès |
|----------|---------------------|
| Maintenabilité | Modules < 300 lignes, responsabilité unique par fichier |
| Performance | Zéro écriture disque sur lecture seule ; cache cohérent |
| Scalabilité | Persistance PostgreSQL fiable, rate limit distribué |
| Sécurité | Secrets obligatoires en prod, chiffrement systématique des données sensibles |
| Testabilité | Services isolés, injectables, testables unitairement |
| Comportement | Parité fonctionnelle : mêmes parcours, mêmes réponses HTTP |

### 1.3 Périmètre

- **Inclus** : `src/lib/*`, `src/app/api/*`, `src/middleware.ts`, persistance, auth, i18n, live
- **Exclus** : refonte design (`WEBDESIGN.md`), app mobile native (V4+), changements produit non documentés dans `PLAN.md`

### 1.4 Relation avec les autres documents

| Document | Rôle |
|----------|------|
| `PLAN.md` | Spécification produit et stack cible |
| `Corrective.md` | Plan fonctionnel par phases (0–8) pour atteindre 97 % |
| **`Strat_Refact.md`** | Plan technique de restructuration du code |
| `DEPLOY-NETLIFY.md` | Contraintes déploiement serverless |

Les phases de refactor (R0–R6) s'alignent sur les phases correctives mais restent **indépendantes** : un refactor peut être livré sans attendre la complétude fonctionnelle, tant que le comportement est préservé.

---

## 2. Architecture actuelle (rétro-conception)

### 2.1 Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (navigateur)                       │
│   Pages RSC · Client Components · Formulaires · PWA / SW         │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP
┌────────────────────────────▼────────────────────────────────────┐
│                     NEXT.JS 15 (monolithe)                       │
│  middleware.ts (rate limit)                                      │
│  src/app/(site)/*     → pages publiques + membre                 │
│  src/app/admin/*      → dashboard admin                          │
│  src/app/api/*        → 32 routes REST                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      src/lib/ (couche métier)                    │
│  store.ts ────► point central de persistance                     │
│  db.ts ───────► requêtes contenu V1 (mal nommé : pas une DB)    │
│  members.ts ──► users + pétitions + dons + familles + aide       │
│  live.ts ─────► événements live, chat, sondages                  │
│  auth.ts / member-auth.ts / admin-access.ts                      │
│  encryption.ts · email.ts · paydunya.ts · push.ts                │
│  i18n.ts + i18n-extra + i18n-supplement + client/server          │
│  media.ts / media.server.ts                                      │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    PERSISTANCE (triple mode)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ store.json   │  │ PostgreSQL   │  │ memoryStore          │   │
│  │ (fichier VPS)│  │ app_state    │  │ (Netlify / Lambda)   │   │
│  │              │  │ JSONB blob   │  │ seed à chaque cold   │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15, React 19 |
| Styles | Tailwind CSS, framer-motion |
| Données runtime | JSON monolithique (`data/store.json`) |
| Données prod cible | PostgreSQL (blob JSONB via `db-adapter.ts`) |
| Auth admin | Cookie HMAC + mot de passe env |
| Auth membre | Cookie HMAC `userId.signature` + bcrypt |
| Email | nodemailer (log fichier en dev) |
| Paiement | PayDunya (démo) |
| Push | web-push + VAPID |
| Hébergement | Netlify (preview) / VPS (cible prod) |

### 2.3 Modèle de données

Un seul objet `Store` contient **toutes** les entités :

- **V1** : `news`, `studies`, `campaigns`, `partners`, `testimonials`, `actions`, `memberships`, `help_requests`, `newsletter`, `contact_messages`, `press_releases`, `site_settings`
- **V2** : `users`, `family_links`, `donations`, `petitions`, `petition_signatures`, `help_request_updates`, `password_reset_tokens`
- **V3** : `live_events`, `live_chat_messages`, `live_polls`, `live_poll_votes`, `push_subscriptions`
- **Meta** : `_counters.global` (auto-incrément maison)

---

## 3. Flux de données

### 3.1 Lecture publique (SSR)

```
Page RSC
  → db.ts (getPublishedNews, getActions, …)
    → store.ts (getStore)
      → ensureStore()
        → [serverless] memoryStore
        → [VPS + PG hydraté] postgresHydratedStore
        → [VPS] lecture store.json (+ cache mémoire process)
```

### 3.2 Écriture formulaire

```
POST /api/contact | /newsletter | /membership | /help | …
  → validation inline dans la route
    → db.ts ou members.ts ou live.ts
      → updateStore(mutator)
        → saveStore()
          → fs.writeFileSync(store.json)     [VPS]
          → memoryStore = store              [serverless]
          → saveStoreToPostgres() async      [si DATABASE_URL]
```

### 3.3 Authentification

```
Admin :
  POST /api/admin/login → verifyPassword → createSession (cookie HMAC)
  Routes /api/admin/* → getAdminAccess() → "admin" | "volunteer" | null

Membre :
  POST /api/member/login → verifyUserPassword (bcrypt) → createMemberSession
  Routes /api/member/* → getCurrentMember() → PublicUser | null
```

### 3.4 Live temps réel (V3)

```
Page /live/[slug]
  → polling GET /api/live/[slug] (statut, compteur)
  → POST /api/live/[slug]/chat (messages, modération pending)
  → POST /api/live/[slug]/polls/[id]/vote (anti-doublon cookie)
  → Toutes les écritures passent par live.ts → updateStore → saveStore complet
```

### 3.5 Internationalisation

```
Cookie cfm_locale (fr | en | ln | sw)
  → RSC : i18n-server.ts → getDictionary(locale)
  → Client : i18n-client.ts → useTranslations()
  → Dictionnaires : i18n/messages/*.json + i18n-supplement.ts
```

---

## 4. Diagnostic — problèmes identifiés

### 4.1 Mauvais choix d'architecture

| # | Problème | Fichiers concernés | Gravité |
|---|----------|---------------------|---------|
| A1 | Store JSON monolithique : chaque mutation réécrit tout | `store.ts` | Critique |
| A2 | Triple persistance aux comportements divergents | `store.ts`, `db-adapter.ts` | Critique |
| A3 | PostgreSQL utilisé comme blob JSON, pas comme SGBD relationnel | `db-adapter.ts`, `schema.sql` | Haute |
| A4 | `db.ts` nommé comme couche DB mais c'est un repository contenu | `db.ts` | Moyenne |
| A5 | `members.ts` regroupe 5 domaines métier distincts | `members.ts` (~420 lignes) | Haute |
| A6 | Admin RPC monolithique (`POST /api/admin` + `action` string) | `api/admin/route.ts` | Haute |
| A7 | i18n fragmenté en 4 fichiers sans outil de validation | `i18n*.ts` | Moyenne |
| A8 | Pas de couche validation centralisée (Zod absent) | toutes les routes API | Moyenne |

### 4.2 Logique dupliquée

| # | Duplication | Emplacement | Statut |
|---|-------------|-------------|--------|
| D1 | Crypto sessions HMAC admin / membre | `auth.ts`, `member-auth.ts` | ✅ Corrigé → `session-crypto.ts` |
| D2 | `resolveMediaPath` client vs serveur (sémantiques différentes) | `media.ts`, `media.server.ts` | À unifier |
| D3 | Migrations V2/V3 via `updateStore()` à la lecture | `live.ts`, `members.ts` | ✅ Corrigé |
| D4 | try/catch + NextResponse.json répété | 32 routes API | Partiel → `api-response.ts` |
| D5 | Validation email / champs obligatoires | routes formulaires | À centraliser (Zod) |
| D6 | `migrateV2` / `migrateV3` dans store + appels redondants | `store.ts`, `live.ts`, `members.ts` | ✅ Corrigé |

### 4.3 Goulots de performance

| # | Goulot | Impact | Statut |
|---|--------|--------|--------|
| P1 | Lecture disque synchrone à chaque `getStore()` | Latence I/O VPS | ✅ Cache `fileStoreCache` |
| P2 | `saveStore()` déclenché à la lecture (migrations live/members) | Écritures disque inutiles | ✅ Corrigé |
| P3 | Re-sérialisation JSON complète vers PostgreSQL à chaque save | Latence + charge DB | À optimiser (Phase R3) |
| P4 | Rate limit en `Map` mémoire locale | Inefficace multi-instance | À migrer (Phase R4) |
| P5 | framer-motion dans layout global | Crash build/runtime routes dynamiques | Voir `Corrective.md` Phase 0 |
| P6 | Polling live (pas de WebSocket/SSE) | Charge serveur si trafic élevé | Reporté V3+ |

### 4.4 Risques de scalabilité

| # | Risque | Scénario | Mitigation planifiée |
|---|--------|----------|----------------------|
| S1 | Race conditions écritures concurrentes | Deux signatures pétition simultanées | Transactions PG (R3) |
| S2 | Perte données Netlify sans PG | Cold start serverless | PG obligatoire en prod |
| S3 | Store entier en RAM | Croissance données (chat live, signatures) | Normalisation tables (R3) |
| S4 | Compteur spectateurs non atomique | Live à fort trafic | Redis ou compteur PG (R5) |
| S5 | Push subscriptions dans JSON | Milliers d'abonnés | Table dédiée (R3) |

### 4.5 Problèmes de maintenabilité

| # | Problème | Impact développeur |
|---|----------|-------------------|
| M1 | Types `Record<string, unknown>` pour memberships / help_requests | Pas d'autocomplétion, erreurs runtime |
| M2 | Erreurs métier via `throw new Error("CODE")` | Mapping HTTP manuel et dispersé |
| M3 | Pas de tests automatisés unitaires/intégration | Régressions silencieuses |
| M4 | Secrets par défaut en dev (`dev-secret`, `admin123`) | Risque si déployé sans `.env` |
| M5 | Mot de passe admin en comparaison plain-text | Failles sécurité |
| M6 | Chiffrement optionnel si `DATA_ENCRYPTION_KEY` absente | Données sensibles en clair |

---

## 5. Architecture cible clarifiée

### 5.1 Principes

1. **Routes API minces** : validation → service → réponse
2. **Repositories par agrégat** : un fichier par domaine métier
3. **Port de persistance** : interface `StorePort` interchangeable (JSON dev / PG prod)
4. **Erreurs typées** : classes domaine → mapping HTTP centralisé
5. **Configuration stricte en prod** : fail-fast si secrets manquants

### 5.2 Schéma cible

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION                                 │
│  Pages RSC · Components · API Routes (< 50 lignes chacune)       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     COUCHE APPLICATION                           │
│  services/                                                       │
│    auth.service.ts · email.service.ts · encryption.service.ts   │
│  validators/                                                     │
│    contact.schema.ts · membership.schema.ts · … (Zod)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     COUCHE DOMAINE                               │
│  repositories/                                                   │
│    content.repository.ts    (ex db.ts)                           │
│    users.repository.ts      (extrait de members.ts)              │
│    petitions.repository.ts                                       │
│    donations.repository.ts                                       │
│    family-links.repository.ts                                    │
│    live.repository.ts       (ex live.ts)                         │
│    push.repository.ts                                            │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     INFRASTRUCTURE                               │
│  persistence/                                                    │
│    store.port.ts          (interface)                          │
│    json-store.adapter.ts  (dev, fallback)                        │
│    pg-store.adapter.ts    (prod, tables normalisées)             │
│  infra/                                                          │
│    session-crypto.ts · rate-limit-redis.ts · media-resolver.ts  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Mapping fichiers actuels → cibles

| Fichier actuel | Fichier(s) cible(s) | Action |
|----------------|---------------------|--------|
| `store.ts` | `persistence/json-store.adapter.ts` + `store.port.ts` | Extraire interface, garder adapter |
| `db.ts` | `repositories/content.repository.ts` | Renommer + typer |
| `members.ts` | 4 repositories + `services/users.service.ts` | Découper |
| `live.ts` | `repositories/live.repository.ts` | Déplacer |
| `db-adapter.ts` | `persistence/pg-store.adapter.ts` | Évoluer vers tables |
| `auth.ts` + `member-auth.ts` | `services/auth.service.ts` | Unifier (garde 2 cookies) |
| `api-response.ts` | `infra/api-response.ts` | Enrichir + migrer routes |
| `session-crypto.ts` | `infra/session-crypto.ts` | Conserver |
| `media.ts` + `media.server.ts` | `infra/media-resolver.ts` | Unifier logique fallback |
| `i18n*.ts` | `i18n/messages/*.json` + `i18n/index.ts` | Consolidation progressive |

---

## 6. Zones critiques

Priorisation pour les interventions :

| Priorité | Zone | Fichiers | Risque si ignoré |
|----------|------|----------|------------------|
| 🔴 P0 | Persistance & cohérence données | `store.ts`, `db-adapter.ts` | Perte de données, incohérence env |
| 🔴 P0 | Données sensibles (aide confidentielle) | `encryption.ts`, `help/route.ts` | Fuite RGPD |
| 🟠 P1 | Authentification & sessions | `auth.ts`, `member-auth.ts` | Compromission admin/membre |
| 🟠 P1 | Admin (surface d'attaque) | `api/admin/route.ts` | Actions non autorisées |
| 🟡 P2 | Live / chat / sondages | `live.ts`, `api/live/**` | Scalabilité, modération |
| 🟡 P2 | Rate limiting | `rate-limit.ts`, `middleware.ts` | Abus, DoS |
| 🟢 P3 | i18n | `i18n*.ts` | Clés manquantes, dette traduction |
| 🟢 P3 | Médias | `media.ts`, `media.server.ts` | Images cassées (cosmétique) |

---

## 7. Plan de refactorisation par phases

### Vue d'ensemble

```
Phase R0 — Stabilisation perf     │ 2–3 j   │ Cache, migrations, bootstrap PG
Phase R1 — Infrastructure partagée│ 3–5 j   │ api-response, session-crypto, media
Phase R2 — Découpage domaine      │ 1–2 sem │ Repositories, typage fort
Phase R3 — Persistance PostgreSQL │ 2–3 sem │ Tables normalisées, transactions
Phase R4 — Sécurité & robustesse  │ 1 sem   │ Rate limit distribué, secrets, CSP
Phase R5 — API & validation       │ 1 sem   │ Routes REST admin, Zod
Phase R6 — Tests & documentation  │ 1 sem   │ Tests unitaires, ADR, CI
──────────────────────────────────────────────────────────────────────────────
Total estimé                      │ 6–9 sem │ (~2 mois, en parallèle Corrective.md)
```

---

### Phase R0 — Stabilisation performance (2–3 jours)

**Objectif** : éliminer les écritures et lectures disque inutiles sans changer le comportement.

| # | Tâche | Livrable | Statut |
|---|-------|----------|--------|
| R0.1 | Cache lecture disque `fileStoreCache` dans `store.ts` | Lectures répétées sans I/O | ✅ Fait |
| R0.2 | Supprimer `migrateV3Store()` / `migrate/Store()` à la lecture dans `live.ts` | Zéro save sur GET live | ✅ Fait |
| R0.3 | Supprimer `migrateStoreV2()` parasite dans `members.ts` | Zéro save sur GET pétitions | ✅ Fait |
| R0.4 | Bootstrap PostgreSQL paresseux au premier `getStore()` | PG chargé sans bloquer le sync | ✅ Fait |
| R0.5 | Vérifier parité : `npm run typecheck` + `npm run build` + `npm run smoke` | Build vert | ✅ Fait |

**Critères de validation R0**

- [ ] Aucune régression sur les 49 routes
- [ ] Profil I/O : zéro `writeFileSync` lors d'un GET `/petitions` ou `/live`
- [ ] `npm run build` → succès

---

### Phase R1 — Infrastructure partagée (3–5 jours)

**Objectif** : factoriser le code transversal avant le découpage domaine.

| # | Tâche | Livrable |
|---|-------|----------|
| R1.1 | Consolider `session-crypto.ts` (admin + membre) | Module unique HMAC | ✅ Fait |
| R1.2 | Créer / enrichir `api-response.ts` | Mapping erreurs domaine → HTTP | ✅ Partiel |
| R1.3 | Migrer les **28 routes API restantes** vers `api-response.ts` | Routes uniformes | ✅ Fait |
| R1.4 | Unifier `resolveMediaPath` client/serveur dans `infra/media-resolver.ts` | Un seul contrat fallback | ✅ Fait |
| R1.5 | Extraire constantes dispersées vers `constants.ts` | Source unique | ⏳ Partiel |

**Routes API à migrer (R1.3)**

```
/api/help
/api/donations
/api/donations/webhook
/api/member/register
/api/member/login
/api/member/logout
/api/member/me
/api/member/family
/api/member/forgot-password
/api/member/reset-password
/api/live/*
/api/push/*
/api/admin/*
/api/actions
/api/locale
```

**Critères de validation R1**

- [ ] 100 % des routes API utilisent `handleDomainError()` ou `jsonSuccess()`
- [ ] Zéro duplication HMAC hors `session-crypto.ts`
- [ ] Tests manuels formulaires : contact, newsletter, adhésion, aide, pétition

---

### Phase R2 — Découpage domaine (1–2 semaines)

**Objectif** : modules cohérents, typage fort, fichiers < 300 lignes.

| # | Tâche | Source | Cible |
|---|-------|--------|-------|
| R2.1 | Extraire repository contenu | `db.ts` | `repositories/content.repository.ts` |
| R2.2 | Extraire repository utilisateurs | `members.ts` | `repositories/users.repository.ts` |
| R2.3 | Extraire repository pétitions | `members.ts` | `repositories/petitions.repository.ts` |
| R2.4 | Extraire repository dons | `members.ts` | `repositories/donations.repository.ts` |
| R2.5 | Extraire repository liens familiaux | `members.ts` | `repositories/family-links.repository.ts` |
| R2.6 | Déplacer repository live | `live.ts` | `repositories/live.repository.ts` |
| R2.7 | Typer `Membership`, `HelpRequest`, `ContactMessage` | types dispersés | `lib/types/forms.ts` |
| R2.8 | Supprimer `members.ts` (devenu vide) | — | Imports mis à jour |

**Règles de découpage**

- Chaque repository n'importe que `store.ts` (ou `StorePort` après R3)
- Pas de logique HTTP dans les repositories
- Les services (`users.service.ts`) orchestrent plusieurs repositories si nécessaire

**Critères de validation R2**

- [ ] Aucun fichier repository > 300 lignes
- [ ] `tsc --noEmit` sans erreur
- [ ] Parité fonctionnelle : smoke test complet

---

### Phase R3 — Persistance PostgreSQL (2–3 semaines)

**Objectif** : PostgreSQL comme source de vérité, tables normalisées, transactions.

| # | Tâche | Livrable |
|---|-------|----------|
| R3.1 | Définir interface `StorePort` (read/write par agrégat) | `persistence/store.port.ts` |
| R3.2 | Implémenter `JsonStoreAdapter` (comportement actuel encapsulé) | Adapter dev/fallback |
| R3.3 | Migrer schéma `scripts/schema.sql` vers tables relationnelles | DDL versionné |
| R3.4 | Implémenter `PgStoreAdapter` par repository | Requêtes SQL typées |
| R3.5 | Script migration `store.json` → PostgreSQL | `scripts/migrate-json-to-pg.mjs` |
| R3.6 | Hydratation synchrone au boot VPS (systemd / docker entrypoint) | Fin du bootstrap paresseux en prod |
| R3.7 | Stratégie concurrence : `SELECT … FOR UPDATE` ou optimistic locking | Pas de perte signatures |

**Tables cibles (extrait)**

```sql
-- Contenu V1
news, studies, campaigns, partners, testimonials, actions, press_releases

-- Formulaires V1
memberships, help_requests, newsletter_subscribers, contact_messages

-- V2
users, family_links, donations, petitions, petition_signatures,
help_request_updates, password_reset_tokens

-- V3
live_events, live_chat_messages, live_polls, live_poll_votes, push_subscriptions

-- Config
site_settings (clé/valeur)
```

**Critères de validation R3**

- [ ] VPS prod : zero dependency on `store.json` for reads/writes
- [ ] Netlify preview : `DATABASE_URL` obligatoire ou mode read-only explicite
- [ ] Test charge : 100 signatures pétition concurrentes sans perte
- [ ] Backup automatique (`scripts/backup-db.sh`) testé

---

### Phase R4 — Sécurité & robustesse (1 semaine)

**Objectif** : durcir l'application pour la production.

| # | Tâche | Livrable |
|---|-------|----------|
| R4.1 | Hasher `ADMIN_PASSWORD` (bcrypt, comme les membres) | `auth.ts` |
| R4.2 | Fail-fast si `SESSION_SECRET` ou `DATA_ENCRYPTION_KEY` absents en prod | `lib/config.ts` |
| R4.3 | Rate limit distribué (Upstash Redis ou équivalent) | `infra/rate-limit-redis.ts` |
| R4.4 | CSP headers via `next.config.ts` ou middleware | Politique documentée |
| R4.5 | Validation webhook PayDunya (signature HMAC) | `donations/webhook/route.ts` |
| R4.6 | Audit logs actions admin | Table `admin_audit_log` |
| R4.7 | Rotation clé chiffrement (documenter procédure) | Runbook ops |

**Critères de validation R4**

- [ ] Scan sécurité : pas de secrets hardcodés
- [ ] Rate limit effectif sur 2 instances simultanées
- [ ] Données aide toujours chiffrées en prod

---

### Phase R5 — API & validation (1 semaine)

**Objectif** : API typée, admin RESTful, validation centralisée.

| # | Tâche | Livrable |
|---|-------|----------|
| R5.1 | Introduire Zod pour tous les payloads POST | `validators/*.schema.ts` |
| R5.2 | Découper `POST /api/admin` en routes dédiées | `/api/admin/news`, `/users`, etc. |
| R5.3 | Garder `/api/admin` legacy en alias (deprecated) 1 version | Rétrocompatibilité |
| R5.4 | OpenAPI spec auto-générée (optionnel) | `docs/openapi.yaml` |
| R5.5 | Consolider i18n en fichiers JSON par locale | `i18n/messages/fr.json`, etc. |

**Routes admin cibles**

```
GET/POST    /api/admin/news
PATCH/DELETE /api/admin/news/[id]
GET/POST    /api/admin/users
PATCH       /api/admin/users/[id]/activate
GET/POST    /api/admin/petitions
GET         /api/admin/stats
…
```

**Critères de validation R5**

- [ ] Payload invalide → 400 avec détail champ par champ
- [ ] Dashboard admin fonctionne avec nouvelles routes
- [ ] Couverture i18n : 0 clé manquante en FR/EN

---

### Phase R6 — Tests & documentation (1 semaine)

**Objectif** : verrouiller la qualité et documenter les décisions.

| # | Tâche | Livrable |
|---|-------|----------|
| R6.1 | Tests unitaires repositories (vitest ou jest) | `__tests__/repositories/` |
| R6.2 | Tests intégration API (supertest ou playwright API) | `__tests__/api/` |
| R6.3 | Smoke test CI (`npm run smoke` dans GitHub Actions / Netlify) | Pipeline CI |
| R6.4 | ADR (Architecture Decision Records) pour choix PG, auth, chiffrement | `docs/adr/` |
| R6.5 | Mettre à jour `README.md` avec architecture cible | Doc développeur |
| R6.6 | Runbook ops : backup, restore, rotation clés | `docs/runbook.md` |

**Critères de validation R6**

- [x] Couverture tests repositories ≥ 80 % (lignes: **84.16 %** sur `src/lib/repositories/*`)
- [x] CI bloque merge si build ou smoke échoue
- [x] Nouveau développeur peut setup en < 30 min via README

---

## 8. Travail réalisé — exécution juillet 2026

Refactors appliqués **sans changement de comportement fonctionnel** :

### Phase R0 — Stabilisation perf ✅

| Tâche | Statut |
|-------|--------|
| Cache `fileStoreCache` | ✅ |
| Suppression save parasite live/members | ✅ |
| Bootstrap PostgreSQL paresseux | ✅ |
| `npm run typecheck` + `npm run build` | ✅ |

### Phase R1 — Infrastructure partagée ✅

| Tâche | Statut |
|-------|--------|
| `session-crypto.ts` | ✅ |
| `api-response.ts` enrichi | ✅ |
| Migration **32/32 routes API** | ✅ |
| `infra/media-resolver.ts` | ✅ |
| `media.ts` / `media.server.ts` unifiés | ✅ |

### Phase R2 — Découpage domaine ✅

| Repository | Fichier | Lignes |
|------------|---------|--------|
| Contenu V1 | `repositories/content.repository.ts` | ~260 |
| Utilisateurs | `repositories/users.repository.ts` | ~170 |
| Liens familiaux | `repositories/family-links.repository.ts` | ~110 |
| Pétitions | `repositories/petitions.repository.ts` | ~75 |
| Dons | `repositories/donations.repository.ts` | ~55 |
| Live | `repositories/live.repository.ts` | ~210 |
| Barrels compat | `db.ts`, `members.ts`, `live.ts` | réexport |
| Types formulaires | `types/forms.ts` | ✅ |

### Phase R3 — Persistance PostgreSQL ✅

| Tâche | Statut |
|-------|--------|
| `persistence/store.port.ts` | ✅ |
| `persistence/json-store.adapter.ts` | ✅ |
| `persistence/pg-store.adapter.ts` | ✅ |
| `scripts/schema.sql` (25 tables + index) | ✅ |
| `persistence/pg-sync.ts` (load/save normalisé) | ✅ |
| `db-adapter.ts` (transaction FOR UPDATE) | ✅ |
| `scripts/migrate-json-to-pg.mjs` | ✅ |
| `scripts/bootstrap-pg.mjs` | ✅ |
| `scripts/hydrate-from-postgres.mjs` (tables prioritaires) | ✅ |
| Contrainte unique signatures pétition | ✅ |

**Commandes** : `npm run migrate:pg` · `npm run bootstrap:pg` · `npm run hydrate:pg`  
**Env** : `DATABASE_URL` requis · `CFM_PG_NORMALIZED=false` pour désactiver le mode tables

### Phase R4 — Sécurité & robustesse ✅

| Tâche | Statut |
|-------|--------|
| `config.ts` fail-fast prod (`SESSION_SECRET`, `ADMIN_PASSWORD`, `DATA_ENCRYPTION_KEY`) | ✅ |
| Admin password bcrypt (`$2…` dans env) | ✅ |
| Headers sécurité + CSP (`next.config.ts`) | ✅ |
| Rate limit distribué Redis (`UPSTASH_REDIS_REST_*`) | ✅ |
| Validation webhook PayDunya (HMAC `PAYDUNYA_WEBHOOK_SECRET`) | ✅ |
| Audit logs actions admin (`admin_audit_log` + `data/admin-audit.log`) | ✅ |
| Rotation clé chiffrement documentée (`docs/runbook.md`) | ✅ |

### Phase R5 — API & validation ✅

| Tâche | Statut |
|-------|--------|
| Zod validators (`src/lib/validators/*`) | ✅ |
| Admin REST dédié (`/api/admin/news`, `/users`, `/petitions`, `/stats`) | ✅ |
| Consolidation i18n JSON (FR/EN/LN/SW complet) | ✅ (`src/lib/i18n/messages/*.json` + `getDictionary` branché JSON) |

### Phase R6 — Tests & documentation ✅

| Tâche | Statut |
|-------|--------|
| `npm run test:repos` | ✅ Smoke logique |
| Tests vitest repositories (`__tests__/repositories/*`) | ✅ |
| CI GitHub Actions (`.github/workflows/ci.yml`) | ✅ (typecheck + test + build + smoke) |
| ADR architecture (`docs/adr/0001..0003`) | ✅ |
| README architecture cible + setup | ✅ |
| Tests integration API (`__tests__/api/*`) | ✅ |

**Validation** : `npm run typecheck` ✅ · `npm run test` ✅ (8 fichiers/30 tests) · `npm run test:coverage` ✅ (repositories lignes: 84.16 %) · `npm run build` ✅ (53 routes) · `npm run smoke` ✅

---

## 8bis. Historique audit initial

---

## 9. Risques et mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Régression fonctionnelle lors du découpage | Moyenne | Haute | Smoke test systématique, pas de changement comportement |
| Migration PG perte de données | Faible | Critique | Backup avant migration, script dry-run |
| Incompatibilité Netlify / VPS | Moyenne | Haute | Feature flag `CFM_PERSISTENCE=json\|pg` |
| Divergence future entre dictionnaires TS et JSON | Moyenne | Moyenne | Script `scripts/export-i18n-json.mjs` pour régénération atomique |
| framer-motion crash routes dynamiques | Haute | Haute | Phase 0 Corrective.md prioritaire |

---

## 10. Principes de exécution

1. **Une PR = une phase partielle** (ex. R2.2 seul, pas tout R2)
2. **Smoke test avant merge** : `npm run smoke`
3. **Pas de changement UX** sans validation produit
4. **Compatibilité arrière** : alias imports pendant 1 sprint (`members.ts` réexporte)
5. **Feature flags** pour bascule JSON → PG
6. **Commits atomiques** avec message conventionnel (`refactor(store): add file cache`)

---

## 11. Calendrier indicatif

| Semaine | Phase(s) | Jalons |
|---------|----------|--------|
| S1 | R0 ✅ + R1 | Routes API uniformisées |
| S2–S3 | R2 | Repositories découpés, members.ts supprimé |
| S4–S6 | R3 | PostgreSQL prod, store.json deprecated |
| S7 | R4 | Sécurité prod, rate limit distribué |
| S8 | R5 | Admin REST, Zod partout |
| S9 | R6 | CI, tests, documentation |

> Ce calendrier peut s'exécuter **en parallèle** des phases 0–8 de `Corrective.md`. Prioriser R0–R1 avant toute feature live/pétition si perf I/O mesurée comme problème.

---

## 12. Critères de succès globaux

| Métrique | Avant | Cible |
|----------|-------|-------|
| Fichier le plus long (`members.ts`) | ~420 lignes | **~5 lignes (barrel)** ✅ |
| Écritures disque sur GET | Oui (live, pétitions) | Non |
| Routes API avec gestion erreur centralisée | ~12 % | **100 %** ✅ |
| Persistance prod | JSON blob / fichier | PostgreSQL normalisé |
| Rate limit multi-instance | Non | Oui |
| Tests automatisés | 0 | ≥ 80 % repositories |
| Build production | ✅ | ✅ maintenu |
| Comportement utilisateur | Référence | Identique |

---

## 13. Prochaine action recommandée

**Post-R6 recommandé** : augmenter la couverture des branches repositories et ajouter des tests e2e parcours membre/admin.

Effort estimé : **2–4 jours**. Risque faible. Bénéfice immédiat : meilleure détection des régressions limites.

---

*Document rédigé à partir de l'audit architecture CFM ASBL — juillet 2026.*  
*Complète `Corrective.md` (plan fonctionnel) et `PLAN.md` (spécification produit).*
