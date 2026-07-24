import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { jsonData } from "@/infrastructure/http/api-response";

/**
 * État de session minimal, pour le header du site public (statique) : un seul
 * booléen, aucune donnée personnelle.
 *
 * `/api/member/me` renvoyait tout le tableau de bord (profil + demandes d'aide
 * + dons) alors que le header ne lit qu'un booléen — un scan de table et de la
 * PII pour rien, à chaque chargement d'une page publique par un membre.
 * `getCurrentMember` se limite à valider la session et à charger l'utilisateur
 * (une requête), et ne renvoie ici que sa présence.
 */
export async function GET() {
  const member = await getCurrentMember();
  return jsonData({ authenticated: Boolean(member) });
}
