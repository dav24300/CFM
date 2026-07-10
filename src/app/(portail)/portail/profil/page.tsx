import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { MemberProfileForm } from "@/components/member/MemberProfileForm";
import { PortalPage } from "@/components/portail/PortalPage";

export const metadata: Metadata = { title: "Portail — Mon profil" };

export default async function PortailProfilPage() {
  const user = await getCurrentMember();
  if (!user) redirect("/membre/connexion");

  return (
    <PortalPage title="Mon profil" subtitle="Gérez vos informations personnelles.">
      <div className="max-w-xl">
        <MemberProfileForm user={user} />
      </div>
    </PortalPage>
  );
}
