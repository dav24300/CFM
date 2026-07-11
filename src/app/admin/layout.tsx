import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminThemeSync } from "@/components/admin/layout/AdminThemeSync";

export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lecture serveur du thème → classe rendue au SSR (pas de FOUC sur le contenu principal).
  const dark = (await cookies()).get("cfm-admin-theme")?.value === "dark";
  return (
    <div className={`theme-admin ${dark ? "dark" : ""} min-h-screen bg-admin-bg font-sans text-admin-ink`}>
      {/* Réplique le thème sur <body> pour les portails Radix (Dialog/Select) rendus hors du sous-arbre. */}
      <AdminThemeSync dark={dark} />
      {children}
    </div>
  );
}
