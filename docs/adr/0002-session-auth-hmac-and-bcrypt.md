# ADR 0002 — Authentification session HMAC + bcrypt

- **Date**: 2026-07
- **Statut**: Acceptee

## Contexte

L'application gere deux profils:
- admin,
- membre.

Le besoin prioritaire est de garder un mecanisme simple, compatible Next.js App Router, sans dependance externe obligatoire de session.

## Decision

- Signature des sessions via HMAC (`src/lib/session-crypto.ts`) avec secret central.
- Hashage des mots de passe via bcrypt (`bcryptjs`) pour les membres.
- Support des mots de passe admin bcryptees (env commencant par `$2`) pour eviter tout stockage clair.

## Consequences

### Positives
- verification de l'integrite des cookies de session,
- reduction du risque sur les credentials,
- migration progressive possible (admin plaintext -> bcrypt).

### Negatives
- la rotation de secret invalide les sessions actives,
- pas de federation IAM native (hors perimetre actuel).
