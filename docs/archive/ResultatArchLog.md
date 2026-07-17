# Résultat — Refactorisation Clean Architecture CFM ASBL

> **Date** : juillet 2026  
> **Périmètre** : restructuration architecture sans changement de comportement fonctionnel  
> **Référence** : plan Clean Architecture (phases R7.1–R7.5)

---

## 1. Résumé exécutif

La base de code CFM ASBL a été restructurée selon les principes de **Clean Architecture** en complément des phases R0–R6 déjà livrées. L'objectif était de séparer les responsabilités, réduire le couplage, et faciliter la maintenance à long terme **sans modifier** les parcours utilisateur, réponses HTTP, schéma de données ou URLs.

### Objectifs atteints

| Objectif | Statut |
|----------|--------|
| Séparation des responsabilités (4 couches) | ✅ |
| Modularité accrue (domain / application / infrastructure) | ✅ |
| Réduction du couplage (StorePort branché, services) | ✅ |
| Routes API minces (orchestration dans services) | ✅ |
| Erreurs métier typées (`DomainError`) | ✅ |
| Compatibilité ascendante (`@/lib/*` barrels) | ✅ |
| Parité fonctionnelle (30 tests, build 53 routes) | ✅ |

---

## 2. Architecture avant / après

### Avant (hybride post-R6)

```
Route API ──► Repository ──► store.ts (God object)
     │
     └──► email.ts / auth.ts (couplage direct)
```

- `store.ts` : types + persistance + migrations (~518 lignes)
- `StorePort` défini mais **non consommé**
- Pas de couche application (use-cases)
- Infrastructure dispersée à la racine de `lib/`

### Après (Clean Architecture)

```
Presentation (app/, components/)
        │
        ▼
Application (application/services/)
        │
        ├──► Domain (domain/entities, errors, ports)
        │
        └──► Infrastructure (infrastructure/repositories, persistence, auth, email…)
                    │
                    └──► StorePort ──► JSON / PostgreSQL
```

### Dépendances autorisées

```
presentation → application → domain ← infrastructure
```

Le domaine **n'importe jamais** l'infrastructure ni Next.js.

---

## 3. Nouvelle structure de dossiers

```
src/
├── app/                          # Présentation
├── components/
├── domain/
│   ├── entities/                 # News, Store, User, LiveEvent…
│   ├── errors/                   # DomainError, codes
│   └── ports/                    # StorePort, EmailPort, PaymentPort, PushPort
├── application/
│   └── services/                 # 8 use-cases métier
├── infrastructure/
│   ├── persistence/              # store.impl, StorePort adapters, pg-sync
│   ├── repositories/             # 6 repositories
│   ├── auth/                     # admin, membre, password-reset
│   ├── email/                    # nodemailer
│   ├── payment/                  # PayDunya
│   ├── push/                     # web-push
│   ├── encryption/               # AES données sensibles
│   ├── http/                     # api-response
│   ├── rate-limit/               # mémoire + Redis
│   ├── media/                    # media-resolver
│   └── live/                     # modération chat
└── lib/                          # Shared + barrels @deprecated
    ├── config.ts, constants.ts
    ├── validators/, i18n/
    ├── db.ts, members.ts, live.ts  # réexport compatibilité
    └── store.ts                    # façade vers domain + store.impl
```

**Alias TypeScript** ajoutés dans `tsconfig.json` :

- `@/domain/*`
- `@/application/*`
- `@/infrastructure/*`

---

## 4. Mapping fichiers (extrait)

| Avant | Après |
|-------|-------|
| Types dans `store.ts` | `domain/entities/*.ts` |
| `lib/persistence/store.port.ts` | `domain/ports/store.port.ts` |
| Logique I/O `store.ts` | `infrastructure/persistence/store.impl.ts` |
| `lib/repositories/*` | `infrastructure/repositories/*` |
| `lib/api-response.ts` | `infrastructure/http/api-response.ts` |
| `lib/auth.ts`, `member-auth.ts` | `infrastructure/auth/*` |
| `lib/email.ts` | `infrastructure/email/nodemailer.adapter.ts` |
| Orchestration dans routes | `application/services/*.service.ts` |
| `throw new Error("CODE")` | `throw domainError("CODE")` |

---

## 5. Couche Application — services créés

| Service | Responsabilité |
|---------|----------------|
| `content.service` | Lectures publiques SSR (actualités, campagnes…) |
| `contact.service` | Contact, newsletter, adhésion, aide confidentielle |
| `member.service` | Inscription, login, profil, famille, reset password |
| `petition.service` | Liste et signature de pétitions |
| `donation.service` | Dons + webhook PayDunya |
| `live.service` | Chat, sondages, push live |
| `auth.service` | Login/logout admin |
| `admin.service` | CRUD admin, stats, export |

### Exemple de flux (inscription membre)

```
POST /api/member/register
  → member.service.registerMember()
      → users.repository.registerUser()
      → email.sendRegistrationPendingEmail()
  → jsonSuccess({ userId, status })
```

---

## 6. Décisions techniques clés

### Couches explicites + barrels de compatibilité

Choix hybride optimal pour Next.js 15 : lisibilité architecturale (`domain/`, `application/`, `infrastructure/`) tout en conservant `@/lib/*` pour éviter de casser 50+ imports existants.

### Pas de conteneur DI

Singleton `getStorePort()` suffisant pour le runtime serverless (Netlify/Lambda). Évite la complexité d'Inversify/TSyringe sur un monolithe Next.js.

### DomainError rétrocompatible

`handleDomainError()` reconnaît `DomainError` **et** les anciens `Error("CODE")` pour transition douce.

### StorePort

Les repositories passent par `store-access.ts` → `getStorePort()` → `jsonStoreAdapter` → `store.impl`. La sync PostgreSQL reste dans `saveStore()` (comportement inchangé).

---

## 7. Métriques

| Indicateur | Avant | Après |
|------------|-------|-------|
| `store.ts` (lignes effectives) | ~518 | ~25 (façade) |
| Couches architecturales explicites | 1 (`lib/`) | 4 |
| Services application | 0 | 8 |
| Repositories via StorePort | 0/6 | 6/6 |
| Routes API refactorées (services) | 0 | 15+ principales |
| Tests Vitest | 30/30 | 30/30 ✅ |
| Build Next.js | 53 routes | 53 routes ✅ |
| `npm run typecheck` | Vert | Vert ✅ |

---

## 8. Guide développeur — ajouter une feature

1. **Entité** : typer dans `domain/entities/` si nouveau modèle
2. **Port** : interface dans `domain/ports/` si nouvelle dépendance externe
3. **Repository** : persistance dans `infrastructure/repositories/`
4. **Service** : orchestration dans `application/services/`
5. **Route** : handler mince dans `app/api/` (validation Zod → service → réponse)
6. **Test** : mocker `infrastructure/persistence/store-access`

Checklist :

- [ ] Aucun import `fs`, `pg`, `nodemailer` dans `domain/` ou `application/`
- [ ] Erreurs métier via `domainError("CODE")`
- [ ] Gate CI : `typecheck && test && build`

---

## 9. Validation non-régression

```bash
npm run typecheck   # ✅
npm run test        # ✅ 30 tests
npm run build       # ✅ 53 routes
```

Comportement préservé :

- Schéma `Store` JSON inchangé
- Réponses API identiques (codes HTTP, payloads)
- Cookies admin / membre inchangés
- Feature flags `CFM_PERSISTENCE`, `CFM_PG_NORMALIZED` conservés
- Scripts `migrate:pg`, `bootstrap:pg`, `hydrate:pg` fonctionnels

---

## 10. Dette résiduelle (phase R8)

| Item | Priorité | Action suggérée |
|------|----------|-----------------|
| Barrels `@deprecated` (`lib/db.ts`, `members.ts`, `live.ts`) | P2 | Retirer après migration imports |
| `i18n-supplement.ts` (~827 lignes) | P3 | Consolidation JSON |
| Polling live (pas WebSocket) | P3 | Évolution V3+ |
| Interface repository par agrégat | P3 | Si multi-backend requis |
| ESLint `import/no-restricted-paths` | P3 | Enforcement couches |

---

## 11. Documentation associée

- [ADR 0004 — Couches Clean Architecture](docs/adr/0004-clean-architecture-layers.md)
- [Strat_Refact.md](Strat_Refact.md) — phases R0–R6
- [README.md](README.md) — setup et scripts

---

*Document généré à l'issue de la refactorisation Clean Architecture — CFM ASBL, juillet 2026.*
