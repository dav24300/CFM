import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPetitionBySlug } from "@/infrastructure/repositories/petitions.repository";
import { PetitionSignForm } from "@/components/PetitionSignForm";
import { getTranslations } from "@/lib/i18n-server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPetitionBySlug(slug);
  return { title: p?.title || "Pétition" };
}

export default async function PetitionDetailPage({ params }: Props) {
  const { slug } = await params;
  const petition = await getPetitionBySlug(slug);
  if (!petition) notFound();

  const { t } = await getTranslations();
  const p = t.petitions;
  const progress = Math.min(100, Math.round((petition.signatures_count / petition.goal) * 100));

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/petitions" className="text-sm text-site-primary hover:underline">
        {p.back}
      </Link>
      <h1 className="section-title mt-4">{petition.title}</h1>
      <p className="section-subtitle">{petition.description}</p>
      {petition.content && <p className="mt-4 text-site-muted">{petition.content}</p>}

      <div className="mt-6 card">
        <div className="flex justify-between text-sm font-semibold">
          <span>
            {petition.signatures_count} {p.signatures}
          </span>
          <span>
            {p.goal} : {petition.goal}
          </span>
        </div>
        <div className="mt-2 h-3 rounded-full bg-site-surface">
          <div className="h-3 rounded-full bg-site-primary" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <PetitionSignForm
        slug={petition.slug}
        petitionTitle={petition.title}
        labels={{
          signTitle: p.signTitle,
          name: p.name,
          email: p.email,
          submit: p.submit,
          success: p.success,
        }}
      />
    </div>
  );
}
