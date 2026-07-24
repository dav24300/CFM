import type { Metadata } from "next";
import { MemberLoginForm } from "@/components/member/MemberLoginForm";
import { getTranslationsFor } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslationsFor("fr");
  return { title: t.pages.memberArea.loginTitle };
}

export default async function MemberLoginPage() {
  const { t } = await getTranslationsFor("fr");
  const m = t.pages.memberArea;

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="section-title text-center">{m.loginTitle}</h1>
      <p className="section-subtitle text-center">{m.loginSubtitle}</p>
      <div className="mt-8 card">
        <MemberLoginForm />
      </div>
    </div>
  );
}
