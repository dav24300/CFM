import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getLoggedInMember } from "@/lib/member-auth";
import { MemberDashboard } from "@/components/member/MemberDashboard";
import { getActiveLiveEventCached } from "@/infrastructure/cache/live-cache";
import { getActivePetitionsCached } from "@/infrastructure/cache/petitions-cache";

export const metadata: Metadata = { title: "Mon espace" };

export default async function MemberDashboardPage() {
  const user = await getLoggedInMember();
  if (!user) redirect("/membre/connexion");

  const [activeLive, petitions] = await Promise.all([
    getActiveLiveEventCached(),
    getActivePetitionsCached(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <MemberDashboard
        initialUser={user}
        activeLive={activeLive ? { slug: activeLive.slug, title: activeLive.title } : null}
        openPetitionsCount={petitions.length}
      />
    </div>
  );
}
