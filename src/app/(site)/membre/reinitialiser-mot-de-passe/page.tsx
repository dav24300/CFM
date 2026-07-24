import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/member/ResetPasswordForm";
import { getTranslationsFor } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Réinitialiser le mot de passe" };

type Props = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const { token } = await searchParams;
  const { t } = await getTranslationsFor("fr");

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="section-title text-center">{t.pages.auth.resetTitle}</h1>
      <p className="section-subtitle text-center">{t.pages.auth.resetSubtitle}</p>
      <div className="mt-8 card">
        <ResetPasswordForm token={token || ""} labels={t.pages.auth} />
      </div>
    </div>
  );
}
