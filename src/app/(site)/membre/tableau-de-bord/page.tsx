import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLoggedInMember } from "@/lib/member-auth";
import { MemberDashboard } from "@/components/member/MemberDashboard";

export const metadata: Metadata = { title: "Mon espace" };

export default async function MemberDashboardPage() {
  const user = await getLoggedInMember();
  if (!user) redirect("/membre/connexion");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <MemberDashboard initialUser={user} />
    </div>
  );
}
