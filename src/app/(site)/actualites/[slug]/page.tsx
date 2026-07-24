import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getPublishedNewsCached as getPublishedNews,
  getActiveCampaignsCached as getActiveCampaigns,
} from "@/infrastructure/cache/content-cache";
import { getResolvedNewsCoverCached as getResolvedNewsCover } from "@/infrastructure/cache/media-cache";
import { getTranslationsFor } from "@/lib/i18n-server";
import { dateLocale } from "@/lib/i18n";
import { ButtonLink } from "@/components/ui/patterns/button-link";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const news = await getPublishedNews();
  return news.map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { t } = await getTranslationsFor("fr");
  const article = (await getPublishedNews()).find((n) => n.slug === slug);
  return { title: article?.title || t.pages.news.fallbackTitle };
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params;
  const { locale, t } = await getTranslationsFor("fr");
  const [news, campaigns] = await Promise.all([getPublishedNews(), getActiveCampaigns()]);
  const article = news.find((n) => n.slug === slug);
  if (!article) notFound();

  const coverImage = await getResolvedNewsCover(article.cover_image);
  const relatedCampaign = campaigns.find(
    (c) => c.slug === article.slug || c.title === article.title
  );
  const petitionHref = relatedCampaign?.petition_slug
    ? `/petitions/${relatedCampaign.petition_slug}`
    : null;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/plaidoyer" className="text-sm text-site-primary hover:underline">
        {t.pages.news.back}
      </Link>

      <div className="media-frame relative mt-6 aspect-video">
        <Image
          src={coverImage}
          alt={article.cover_image_alt || article.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 768px"
          priority
        />
      </div>

      <time className="mt-4 block text-sm text-gray-500">
        {new Date(article.created_at).toLocaleDateString(dateLocale(locale), {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </time>

      <h1 className="section-title mt-2">{article.title}</h1>
      {article.excerpt && <p className="section-subtitle">{article.excerpt}</p>}

      <div className="prose-cfm mt-8 whitespace-pre-wrap text-site-muted leading-relaxed">
        {article.content}
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        {petitionHref ? (
          <ButtonLink href={petitionHref} data-cta="cta_petition">
            {t.ux.news.viewCampaign}
          </ButtonLink>
        ) : (
          <ButtonLink href="/plaidoyer" variant="secondary">
            {t.ux.news.viewAdvocacy}
          </ButtonLink>
        )}
      </div>
    </article>
  );
}
