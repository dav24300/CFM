import { redirect } from "next/navigation";

/**
 * Profil membre legacy — déprécié. Canonique : /portail/profil.
 * Stub de redirection conservé (fenêtre de dépréciation).
 */
export default function LegacyMemberProfilePage() {
  redirect("/portail/profil");
}
