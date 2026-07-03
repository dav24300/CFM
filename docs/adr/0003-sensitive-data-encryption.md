# ADR 0003 — Chiffrement des donnees sensibles

- **Date**: 2026-07
- **Statut**: Acceptee

## Contexte

Les formulaires de demande d'aide peuvent contenir des donnees personnelles sensibles.
Une protection au repos est necessaire, meme si la base applicative est compromise.

## Decision

- Chiffrer les champs sensibles avec AES-256-GCM (`src/lib/encryption.ts`).
- Rendre `DATA_ENCRYPTION_KEY` obligatoire en production (`src/lib/config.ts`).
- Documenter la rotation de cle dans `docs/runbook.md`.

## Consequences

### Positives
- reduction de l'impact d'une fuite de donnees,
- alignement sur les bonnes pratiques de protection des donnees personnelles.

### Negatives
- operation de rotation de cle a maitriser rigoureusement,
- complexite de diagnostic superieure en exploitation.
