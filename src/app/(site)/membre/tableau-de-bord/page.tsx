import { redirect } from "next/navigation";

/**
 * Espace membre legacy — déprécié. L'espace canonique est /portail.
 * Stub de redirection conservé (fenêtre de dépréciation) pour les liens et
 * emails d'activation déjà diffusés. /portail gère l'authentification.
 */
export default function LegacyMemberDashboardPage() {
  redirect("/portail");
}
