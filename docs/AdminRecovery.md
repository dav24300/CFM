# AdminRecovery — Plan de refonte du tableau de bord admin CFM ASBL

> **Date** : juillet 2026  
> **Objectif** : porter l'admin de ~45 % de couverture fonctionnelle à **100 %** sur toutes les entités V1–V3  
> **Horizon** : 8–12 semaines (niveau enterprise)  
> **Base** : audit code `src/components/admin/*`, `src/app/api/admin/*`, entretien vision produit

---

## 1. Vision produit (validée)

| Dimension | Choix |
|-----------|-------|
| **Utilisateur principal** | 1 personne (fondateur / bénévole unique) au quotidien |
| **Priorité fonctionnelle** | **Équilibrée** — V1 contenu + V2 communauté + V3 mobilisation en parallèle |
| **Ambition UX** | **Enterprise** — analytics, workflows, historique audit, exports |
| **Rôle bénévole** | **Quasi-admin** — accès à toutes les fonctionnalités (sauf actions destructives sensibles si besoin) |
| **Périmètre** | **Tout couvrir** — y compris i18n, partenaires, constantes, journal d'audit |
| **Appareil** | **Desktop uniquement** (pas de contrainte mobile-first) |
| **Deadline** | **8–12 semaines** — livraison complète, pas de MVP tronqué |

### Principe directeur

> Un **centre de commandement unique** pour gérer 100 % du site public, de la communauté et de la mobilisation — sans toucher au code ni à la base de données manuellement.

### Tension à résoudre

Solo utilisateur + UX enterprise : l'interface doit rester **dense mais pas complexe** — informations regroupées par workflow métier, pas par couche technique.

---

## 2. État actuel (audit technique)

### 2.1 Ce que l'admin fait aujourd'hui

| Zone | Capacités actuelles |
|------|---------------------|
| **Auth** | Login mot de passe `/admin` ; bénévoles via session membre `role=volunteer` |
| **V1 Triage** | Demandes d'aide (liste + marquer traité), adhésions (approuver), newsletter (lecture seule) |
| **V1 Contenu** | Créer actualités, témoignages, actions — **pas d'édition ni suppression** |
| **V2 Communauté** | Activer membres, approuver liens familiaux, voir dons, créer/exporter pétitions |
| **V3 Mobilisation** | Créer live, démarrer/terminer/replay, modérer chat, créer sondages, envoyer push |
| **Design** | Remplacer 3 images homepage (hero, poster, mission) |

### 2.2 Score de couverture admin par module

| Module produit | Admin actuel | Cible |
|----------------|--------------|-------|
| Actualités | 40 % (create only) | 100 % |
| Études | 0 % | 100 % |
| Campagnes | 0 % | 100 % |
| Communiqués presse | 0 % | 100 % |
| Témoignages | 30 % (create only) | 100 % |
| Actions RDC | 40 % (create only) | 100 % |
| Messages contact | 0 % (data chargée, pas affichée) | 100 % |
| Aide confidentielle | 60 % | 100 % |
| Adhésions V1 | 70 % | 100 % |
| Newsletter | 50 % (lecture) | 100 % |
| Membres V2 | 60 % | 100 % |
| Liens familiaux | 70 % | 100 % |
| Pétitions | 50 % | 100 % |
| Dons | 30 % (lecture) | 100 % |
| Live + chat + sondages | 75 % | 100 % |
| Push PWA | 60 % | 100 % |
| Médias / design | 40 % | 100 % |
| Partenaires | 0 % | 100 % |
| i18n (FR/EN/LN/SW) | 0 % | 100 % |
| Constantes site | 0 % | 100 % |
| Journal d'audit | 0 % (écrit serveur, pas de UI) | 100 % |

**Score global estimé admin** : **~45 %** → cible **100 %**

### 2.3 Dette technique identifiée

1. **APIs REST existantes non branchées** — `/api/admin/news/[id]`, `/users/[id]/activate`, `/petitions` REST
2. **Monolithe POST `/api/admin`** — toutes les actions passent par un seul endpoint `action=...`
3. **Pas de feedback UX** — pas de toasts, confirmations, états de chargement cohérents
4. **Header incorrect** — affiche « bénévole V1 » même pour admin complet
5. **Replay live hardcodé** — URL YouTube fixe au lieu du champ `replay_url`
6. **Hero video** — API prête, UI absente

---

## 3. Architecture cible

### 3.1 Structure de navigation (desktop)

```
/admin/dashboard
├── 📊 Vue d'ensemble          ← KPIs, alertes, activité récente, audit
├── 📥 Boîte de réception      ← Aide, contact, adhésions (workflow unifié)
├── 📝 Contenu                 ← Actualités, études, campagnes, presse, témoignages
├── 🗺️ Actions & territoire    ← Actions par province, carte RDC
├── 👥 Communauté              ← Membres, familles, pétitions, newsletter
├── 💰 Dons & transparence     ← Dons, réconciliation, export comptable
├── 📡 Live & mobilisation     ← Événements, chat, sondages, push
├── 🎨 Médias & design         ← Tous assets (hero, axes, FIKIN, presse PDF)
├── 🌐 Langues & textes        ← i18n FR/EN/LN/SW + constantes site
├── 🤝 Partenaires             ← CRUD partenaires
└── 📋 Journal & exports       ← Audit log, exports CSV/PDF globaux
```

### 3.2 Modèle de rôles (quasi-admin bénévole)

| Action | Admin fondateur | Bénévole |
|--------|-----------------|----------|
| Lecture toutes sections | ✅ | ✅ |
| Créer / modifier contenu | ✅ | ✅ |
| Triage aide & adhésions | ✅ | ✅ |
| Activer / suspendre membres | ✅ | ✅ |
| Modération live & push | ✅ | ✅ |
| Suppression définitive | ✅ | ⚠️ avec confirmation double |
| Modifier i18n / constantes | ✅ | ✅ |
| Voir journal d'audit | ✅ | ✅ (lecture) |

### 3.3 Stack UI (évolution minimale)

- Conserver **React client components** dans `src/components/admin/`
- Introduire **sous-composants par domaine** (max 250 lignes/fichier)
- **Design system existant** — `ui/primitives`, `ui/patterns`
- **Tables** — composant `DataTable` réutilisable (tri, filtre, pagination)
- **Formulaires** — `FormField` + Zod (aligné `admin-api.ts`)
- **Feedback** — toasts globaux + `Alert` inline

### 3.4 API — stratégie de consolidation

**Phase A** : brancher l'UI sur les REST existants (`/api/admin/news/[id]`, etc.)  
**Phase B** : migrer progressivement le monolithe `POST /api/admin` vers routes REST par ressource  
**Phase C** : déprécier le monolithe (garder compat 1 version)

---

## 4. Plan de livraison — 12 semaines

### Phase A — Fondations UX (semaines 1–2)

**Objectif** : infrastructure admin réutilisable + corrections bloquantes

| # | Tâche | Livrable |
|---|-------|----------|
| A.1 | Refactor navigation — 10 sections, sidebar desktop | `AdminLayout` + `AdminSidebar` |
| A.2 | Composant `DataTable` (tri, recherche, pagination) | `components/admin/ui/data-table.tsx` |
| A.3 | Système toasts + confirmations destructives | `AdminToastProvider` |
| A.4 | Corriger header rôle + badges alertes (pending counts) | Dashboard header dynamique |
| A.5 | Vue d'ensemble enrichie — KPIs V1+V2+V3 + graphique 7j | Section analytics |

**Critères** : navigation claire, feedback sur chaque action, overview utile en < 5 s

---

### Phase B — V1 Contenu complet (semaines 3–4)

**Objectif** : CMS 100 % pour tout le contenu public

| # | Tâche | Entité |
|---|-------|--------|
| B.1 | CRUD actualités — édition, suppression, toggle publié, image couverture | `news` |
| B.2 | CRUD études — upload PDF, résumé, contenu | `studies` |
| B.3 | CRUD campagnes — image, lien pétition | `campaigns` |
| B.4 | CRUD communiqués presse — fichier PDF | `press_releases` |
| B.5 | CRUD témoignages — liste, édition, anonymat, photo | `testimonials` |
| B.6 | Brancher REST `/api/admin/news/[id]` dans l'UI | API existante |

**Critères** : chaque type de contenu créable, éditable, supprimable depuis l'admin ; changement visible sur le site en < 5 min (cache invalidation)

---

### Phase C — V1 Opérations & territoire (semaines 5–6)

**Objectif** : triage complet + actions RDC + contacts

| # | Tâche | Détail |
|---|-------|--------|
| C.1 | Onglet **Messages contact** — liste, marquer lu, export CSV | `contact_messages` |
| C.2 | Workflow aide **complet** — statuts, notes internes, `help_update` + email membre | `help_requests` + `help_request_updates` |
| C.3 | Adhésions — rejeter, détail complet, export | `memberships` |
| C.4 | Newsletter — export CSV, recherche email | `newsletter` |
| C.5 | CRUD actions provinciales — édition, suppression, photo | `actions` |
| C.6 | Aperçu carte RDC — provinces avec/sans actions | lien visuel `/actions` |

**Critères** : zéro formulaire public sans réponse traçable dans l'admin

---

### Phase D — V2 Communauté & dons (semaines 7–8)

**Objectif** : gestion complète membres, pétitions, dons

| # | Tâche | Détail |
|---|-------|--------|
| D.1 | Membres — suspendre, profil détail, changer rôle, export | `users` + PATCH existant |
| D.2 | Liens familiaux — rejeter, historique statuts | `family_links` |
| D.3 | Pétitions — édition, désactiver, voir signatures, export CSV | `petitions` |
| D.4 | Dons — statut manuel, réconciliation PayDunya, reçu email, export | `donations` |
| D.5 | Transparence donateurs — toggle affichage public (anonymisé) | `site_settings` |

**Critères** : parcours membre entièrement pilotable depuis l'admin

---

### Phase E — V3 Live & mobilisation (semaines 9–10)

**Objectif** : contrôle live enterprise

| # | Tâche | Détail |
|---|-------|--------|
| E.1 | Live — édition titre/description/thumbnail/replay_url/stream_url | `live_events` |
| E.2 | Badge pending chat sur chaque événement (API `pending` déjà là) | UI alertes |
| E.3 | Chat — historique complet, modération bulk | `live_chat_messages` |
| E.4 | Sondages — fermer, voir résultats, exporter votes | `live_polls` |
| E.5 | Push — liste abonnés, stats envoi, templates prédéfinis | `push_subscriptions` |
| E.6 | Corriger replay hardcodé → champ éditable | `AdminV3Panel` |

**Critères** : événement live gérable de bout en bout sans quitter l'admin

---

### Phase F — Design, i18n, gouvernance (semaines 11–12)

**Objectif** : 100 % couverture + enterprise finish

| # | Tâche | Détail |
|---|-------|--------|
| F.1 | Médias — hero video, images axes, galerie FIKIN, PDF presse | `AdminDesignPanel` étendu |
| F.2 | Partenaires — CRUD complet | `partners` |
| F.3 | Éditeur i18n — clés par locale (FR/EN/LN/SW), preview | `messages/*.json` |
| F.4 | Constantes site — tagline, réseaux sociaux, emails | `site_settings` |
| F.5 | Journal d'audit — lecture filtrée par date/action/acteur | `admin_audit_log` |
| F.6 | Exports globaux — CSV toutes entités, rapport mensuel PDF | nouvel endpoint |
| F.7 | Tests E2E admin — 15 parcours critiques | `__tests__/admin/` |
| F.8 | Documentation runbook admin | `docs/admin-runbook.md` |

**Critères** : score admin **100 %** ; fondateur autonome sans support technique

---

## 5. Spécifications UX enterprise (desktop)

### 5.1 Vue d'ensemble — widgets

```
┌─────────────────────────────────────────────────────────────┐
│  CFM Admin — Bonjour, [Nom]          [🔔 3 alertes] [Logout] │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Aide    │ │ Membres │ │ Dons    │ │ Live    │  KPI cards │
│  │ 3 new   │ │ 2 pend. │ │ 12 mois │ │ 0 live  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│  ┌──────────────────────────┐ ┌──────────────────────────┐ │
│  │ Activité 7 derniers jours  │ │ Actions rapides          │ │
│  │ [graphique barres]         │ │ + Actualité  + Live      │ │
│  └──────────────────────────┘ │ + Push       Voir aide     │ │
│                                └──────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ Journal récent (5 dernières actions admin)              │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Patterns obligatoires

| Pattern | Règle |
|---------|-------|
| **Liste + détail** | Clic ligne → panneau latéral ou page détail |
| **Actions ligne** | Éditer · Publier/Dépublier · Supprimer (confirm) |
| **États** | Badge couleur : `new`, `pending`, `active`, `processed`, `suspended` |
| **Feedback** | Toast succès/erreur sur chaque mutation |
| **Recherche** | Champ recherche sur toutes les listes > 20 items |
| **Export** | Bouton CSV sur chaque table exportable |
| **Empty state** | Message + CTA créer quand liste vide |

### 5.3 Alertes prioritaires (badges sidebar)

- Demandes d'aide `status=new`
- Adhésions `status=pending`
- Membres `status=pending`
- Messages chat `status=pending`
- Liens familiaux `status=pending_child`

---

## 6. Mapping API → UI (à brancher)

### Déjà implémenté côté API, à connecter

| Endpoint | Action UI à créer |
|----------|-------------------|
| `PATCH /api/admin/news/[id]` | Éditeur actualité |
| `DELETE /api/admin/news/[id]` | Supprimer actualité |
| `PATCH /api/admin/users/[id]/activate` | Suspendre membre |
| `POST /api/admin` `help_update` | Formulaire suivi aide |
| `POST /api/admin` `suspend_user` | Bouton suspendre |
| `POST /api/admin` `delete` | Suppression études/campagnes/presse |
| `PATCH /api/admin/media` | Upload hero video |
| `GET /api/admin/stats` | Remplacer stats monolithiques |
| `GET /api/admin/live` `pending` | Badge modération chat |

### Nouveaux endpoints à créer

| Endpoint | Besoin |
|----------|--------|
| `GET /api/admin/audit` | Journal d'audit paginé |
| `GET /api/admin/export/[entity]` | Export CSV générique |
| `PATCH /api/admin/i18n` | Mise à jour clés traduction |
| `PATCH /api/admin/settings` | Constantes site |
| `POST /api/admin/family-links/[id]/reject` | Rejeter lien familial |
| `PATCH /api/admin/donations/[id]` | Réconciliation manuelle |

---

## 7. Structure fichiers cible

```
src/components/admin/
├── layout/
│   ├── AdminSidebar.tsx
│   ├── AdminHeader.tsx
│   └── AdminToastProvider.tsx
├── ui/
│   ├── data-table.tsx
│   ├── status-badge.tsx
│   ├── confirm-dialog.tsx
│   └── export-button.tsx
├── overview/
│   └── AdminOverview.tsx
├── inbox/
│   ├── HelpInbox.tsx
│   ├── ContactInbox.tsx
│   └── MembershipInbox.tsx
├── content/
│   ├── NewsManager.tsx
│   ├── StudiesManager.tsx
│   ├── CampaignsManager.tsx
│   ├── PressManager.tsx
│   └── TestimonialsManager.tsx
├── community/
│   ├── MembersManager.tsx
│   ├── FamilyLinksManager.tsx
│   ├── PetitionsManager.tsx
│   └── NewsletterManager.tsx
├── donations/
│   └── DonationsManager.tsx
├── live/
│   ├── LiveEventsManager.tsx
│   ├── ChatModeration.tsx
│   ├── PollsManager.tsx
│   └── PushManager.tsx
├── design/
│   └── MediaManager.tsx
├── i18n/
│   └── I18nEditor.tsx
├── partners/
│   └── PartnersManager.tsx
├── audit/
│   └── AuditLogViewer.tsx
└── AdminDashboard.tsx          ← orchestrateur léger
```

---

## 8. Indicateurs de succès

| Indicateur | Cible |
|------------|-------|
| Modules admin à 100 % | 21/21 |
| Actions sans feedback UX | 0 |
| Entités modifiables uniquement via code/DB | 0 |
| Temps réponse triage aide | < 2 min (ouvrir → marquer traité) |
| Temps création actualité | < 3 min |
| Temps lancement live | < 1 min |
| Parcours E2E admin | 15/15 verts |
| Satisfaction fondateur (auto-éval) | Autonome sans aide technique |

---

## 9. Risques & mitigations

| Risque | Mitigation |
|--------|------------|
| Scope 12 semaines trop large pour 1 dev | Livraison par phase ; chaque phase = admin utilisable |
| Solo user + UX enterprise = surcharge | Overview actionnable ; masquer sections vides |
| Quasi-admin bénévole = erreurs | Confirmations doubles sur suppressions |
| i18n editor = complexité | Éditeur clé par clé, pas WYSIWYG page entière en v1 |
| Régression APIs monolithiques | Tests API existants + nouveaux tests admin E2E |

---

## 10. Prochaines étapes immédiates

1. **Valider ce document** — confirmer phases et priorités
2. **Phase A semaine 1** — `AdminSidebar` + `DataTable` + toasts
3. **Quick win jour 1** — brancher édition actualités sur REST existant
4. **Quick win jour 2** — onglet messages contact (data déjà chargée)

---

## Annexe A — Réponses vision produit (juillet 2026)

| Question | Réponse |
|----------|---------|
| Utilisateurs admin | 1 fondateur au quotidien |
| Priorité | V1 + V2 + V3 équilibré |
| Niveau UX | Enterprise (analytics, audit, exports) |
| Rôle bénévole | Quasi-admin — toutes fonctionnalités |
| Exclusions | Aucune — tout couvrir |
| Délai | 8–12 semaines |
| Device | Desktop uniquement |

---

## Annexe B — Références

| Document | Lien |
|----------|------|
| Plan produit | `PLAN.md` |
| Correctif fonctionnel | `archive/Corrective.md` § module 7 Admin |
| APIs admin | `src/app/api/admin/*` |
| Composants actuels | `src/components/admin/*` |
| Schéma données | `scripts/schema.sql` |
