# ADR 0004 — Couches Clean Architecture

## Statut

Accepté — juillet 2026

## Contexte

Après les phases R0–R6 (`../archive/Strat_Refact.md`), le code disposait de repositories et d'un `StorePort` non branché, mais les routes API appelaient encore directement repositories et modules infra. Les types métier vivaient dans `store.ts` (~518 lignes).

## Décision

Adopter une architecture en **4 couches explicites** sous `src/` :

| Couche | Dossier | Règle |
|--------|---------|-------|
| Présentation | `app/`, `components/` | HTTP, RSC, UI uniquement |
| Application | `application/services/` | Use-cases, orchestration |
| Domaine | `domain/` | Entités, erreurs, ports (interfaces) |
| Infrastructure | `infrastructure/` | Persistance, auth, email, paiement |

Les imports `@/lib/*` restent comme **barrels @deprecated** pour compatibilité ascendante pendant un sprint.

`StorePort` est branché via `getStorePort()` ; les repositories utilisent `store-access.ts`.

Pas de conteneur DI : singleton module suffisant pour Next.js serverless.

## Conséquences

- Routes API minces (< 30 lignes pour les cas simples)
- Tests mockent `infrastructure/persistence/store-access`
- Nouveaux développements : `application/services` → `infrastructure/repositories`
- Dette résiduelle : retirer barrels `lib/db.ts`, `lib/members.ts`, `lib/live.ts` en phase R8
