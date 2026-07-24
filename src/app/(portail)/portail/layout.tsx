import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { getLocale, getTranslationsFor } from "@/lib/i18n-server";
import { portalRole } from "@/lib/portal-role";
import { PortalShell } from "@/components/portail/PortalShell";
import { I18nProvider } from "@/components/i18n/I18nProvider";

export default async function PortailLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentMember();
  if (!user) redirect("/membre/connexion");

  const initials = `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || "M";
  // Le portail est dynamique (session obligatoire) : il peut lire le cookie de
  // langue. Le fournisseur i18n RACINE est figé sur le français pour rendre le
  // site public statique ; ce fournisseur imbriqué réinjecte la vraie locale
  // du membre pour les composants client du portail (profil, etc.).
  const locale = await getLocale();
  const { t } = await getTranslationsFor(locale);

  return (
    <I18nProvider locale={locale} messages={t}>
      <PortalShell
        name={`${user.first_name} ${user.last_name}`.trim() || "Membre CFM"}
        initials={initials}
        initialRole={portalRole(user)}
        locale={locale}
      >
        {children}
      </PortalShell>
    </I18nProvider>
  );
}
