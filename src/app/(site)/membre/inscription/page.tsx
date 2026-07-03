import type { Metadata } from "next";
import { MemberRegisterForm } from "@/components/member/MemberRegisterForm";
import { getTranslations } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.pages.memberArea.registerTitle };
}

export default async function MemberRegisterPage() {
  const { t } = await getTranslations();
  const m = t.pages.memberArea;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="section-title">{m.registerTitle}</h1>
      <p className="section-subtitle">{m.registerSubtitle}</p>
      <div className="mt-8 card">
        <MemberRegisterForm />
      </div>
    </div>
  );
}
