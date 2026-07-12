import { redirect } from "next/navigation";
import Link from "next/link";
import { getMemberSessionUserId, toPublicUser } from "@/infrastructure/auth/member-auth";
import { getUserById } from "@/infrastructure/repositories/users.repository";
import { MemberProfileForm } from "@/components/member/MemberProfileForm";
import { getTranslations } from "@/lib/i18n-server";

export default async function MemberProfilePage() {
  const userId = await getMemberSessionUserId();
  if (!userId) redirect("/membre/connexion");

  const user = await getUserById(userId);
  if (!user) redirect("/membre/connexion");

  const { t } = await getTranslations();
  const m = t.pages.memberArea;

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Link href="/membre/tableau-de-bord" className="text-sm text-site-primary hover:underline">
        {m.profileBack}
      </Link>
      <h1 className="section-title mt-4">{m.profileTitle}</h1>
      <MemberProfileForm user={toPublicUser(user)} />
    </div>
  );
}
