import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { loginMember } from "@/application/services/member.service";
import { normalizePhoneRdc } from "@/domain/phone";
import { checkRateLimitDistributed } from "@/infrastructure/rate-limit/memory";
import {
  handleDomainError,
  jsonError,
  jsonSuccess,
  jsonUnauthorized,
} from "@/infrastructure/http/api-response";

// Compteur par IDENTIFIANT, en plus du plafond IP:route du middleware. Un numéro
// est bien plus énumérable qu'un email (espace restreint, préfixes connus), et
// le plafond middleware est desserré à 200/10 min pour le NAT opérateur RDC —
// insuffisant seul face à une attaque ciblée sur un compte.
const ID_WINDOW_MS = Number.parseInt(process.env.CFM_RL_LOGIN_ID_WINDOW_MS ?? "", 10) || 900_000;
const ID_MAX = Number.parseInt(process.env.CFM_RL_LOGIN_ID_MAX ?? "", 10) || 10;

/** Même seau pour toutes les écritures d'un numéro (0812… ≡ +243812…). */
function identifierBucket(identifier: string): string {
  const canonical = normalizePhoneRdc(identifier) ?? identifier.toLowerCase();
  // On ne stocke qu'un SHA-256 tronqué : le magasin de rate-limit (Upstash,
  // tiers) ne doit jamais contenir le numéro ou l'email en clair.
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // `email` conservé en repli : les pages du tunnel sont statifiées, un bundle
    // client en cache CDN/navigateur peut encore envoyer { email } plusieurs
    // heures après le déploiement. Ce repli évite de déconnecter le site pendant
    // la propagation.
    const identifier = String(body.identifier ?? body.email ?? "").trim();
    const password = body.password;
    if (!identifier || !password) {
      return jsonError("Champs requis", 400);
    }

    const { ok } = await checkRateLimitDistributed(`login-id:${identifierBucket(identifier)}`, {
      windowMs: ID_WINDOW_MS,
      max: ID_MAX,
    });
    if (!ok) {
      return jsonError("Trop de tentatives sur cet identifiant. Réessayez plus tard.", 429);
    }

    // Les statuts pending/suspended sont refusés par loginMember (403 domaine)
    // avant toute création de session.
    const user = await loginMember(identifier, password);
    if (!user) {
      return jsonUnauthorized("Identifiant ou mot de passe incorrect");
    }

    return jsonSuccess({ user });
  } catch (err) {
    return handleDomainError(err);
  }
}
