# ADR 0001 — Persistance PostgreSQL normalisee

- **Date**: 2026-07
- **Statut**: Acceptee

## Contexte

La persistance historique `data/store.json` est simple mais limitee:
- contention d'ecriture (fichier monolithique),
- risque de perte de donnees en serverless,
- difficulte d'audit et de requetage ciblé.

## Decision

Conserver une compatibilite ascendante tout en adoptant PostgreSQL normalise:
- schema relationnel (`scripts/schema.sql`),
- synchronisation globale via `src/lib/persistence/pg-sync.ts`,
- transactions et verrou `FOR UPDATE` dans `src/lib/db-adapter.ts`.

Le blob JSONB historique reste supporte pour migration progressive.

## Consequences

### Positives
- meilleure robustesse en production multi-instances,
- contraintes SQL explicites (integrite),
- support d'audit et de backup plus standards.

### Negatives
- cout de migration et d'exploitation DB,
- complexite superieure a un stockage fichier.
