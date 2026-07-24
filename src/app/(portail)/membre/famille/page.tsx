import type { Metadata } from "next";
import { FamilyLinkManager } from "@/components/member/FamilyLinkManager";
import { PortalPage } from "@/components/portail/PortalPage";

export const metadata: Metadata = { title: "Portail — Ma famille" };

export default function PortailFamillePage() {
  return (
    <PortalPage
      title="Ma famille"
      subtitle="Gérez vos liens familiaux militaires (parent, conjoint, enfant)."
    >
      <div className="max-w-2xl">
        <FamilyLinkManager />
      </div>
    </PortalPage>
  );
}
