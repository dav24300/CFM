import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/member/ForgotPasswordForm";
import { getTranslations } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.pages.auth.forgotTitle };
}

export default async function ForgotPasswordPage() {
  const { t } = await getTranslations();
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="section-title text-center">{t.pages.auth.forgotTitle}</h1>
      <p className="section-subtitle text-center">{t.pages.auth.forgotSubtitle}</p>
      <div className="mt-8 card">
        <ForgotPasswordForm labels={t.pages.auth} />
      </div>
    </div>
  );
}
