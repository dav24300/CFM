import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { getLocale } from "@/lib/i18n-server";
import { portalRole } from "@/lib/portal-role";
import { PortalShell } from "@/components/portail/PortalShell";

export default async function PortailLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentMember();
  if (!user) redirect("/membre/connexion");

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "M";
  const locale = await getLocale();

  return (
    <PortalShell
      name={`${user.first_name} ${user.last_name}`.trim() || "Membre CFM"}
      initials={initials}
      initialRole={portalRole(user)}
      locale={locale}
    >
      {children}
    </PortalShell>
  );
}
