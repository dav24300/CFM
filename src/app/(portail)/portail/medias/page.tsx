import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { getResolvedGallery } from "@/lib/media.server";
import { PortalPage, PortalEmpty } from "@/components/portail/PortalPage";
import { MediaMosaic } from "@/components/portail/MediaMosaic";

export const metadata: Metadata = { title: "Portail — Médias & galerie" };

export default async function PortailMediasPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/membre/connexion");

  const gallery = await getResolvedGallery();

  return (
    <PortalPage
      title="Médias & galerie"
      subtitle="Photos et vidéos des rassemblements, du terrain et des ateliers CFM."
    >
      {gallery.length === 0 ? (
        <PortalEmpty>La galerie sera bientôt disponible.</PortalEmpty>
      ) : (
        <MediaMosaic images={gallery} />
      )}
    </PortalPage>
  );
}
