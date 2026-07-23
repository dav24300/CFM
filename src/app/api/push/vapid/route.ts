import { getVapidPublicKey } from "@/infrastructure/push/web-push.adapter";
import { jsonPublicCached } from "@/infrastructure/http/api-response";

export async function GET() {
  // Clé publique VAPID : constante de déploiement, inutile de réinterroger
  // l'origine à chaque chargement de page.
  return jsonPublicCached(
    { publicKey: getVapidPublicKey() },
    { sMaxAge: 3600, staleWhileRevalidate: 86_400 }
  );
}
