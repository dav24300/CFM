import type { Metadata } from "next";

import Link from "next/link";

import Image from "next/image";

import { notFound } from "next/navigation";

import { getPublishedNews } from "@/lib/db";

import { getResolvedNewsCover } from "@/lib/media.server";

import { getTranslations } from "@/lib/i18n-server";

import { dateLocale } from "@/lib/i18n-supplement";



type Props = { params: Promise<{ slug: string }> };



export async function generateMetadata({ params }: Props): Promise<Metadata> {

  const { slug } = await params;

  const { t } = await getTranslations();

  const article = (await getPublishedNews()).find((n) => n.slug === slug);

  return { title: article?.title || t.pages.news.fallbackTitle };

}



export default async function NewsDetailPage({ params }: Props) {

  const { slug } = await params;

  const { locale, t } = await getTranslations();

  const article = (await getPublishedNews()).find((n) => n.slug === slug);

  if (!article) notFound();

  const coverImage = await getResolvedNewsCover(article.cover_image);

  return (

    <article className="mx-auto max-w-3xl px-4 py-12">

      <Link href="/plaidoyer" className="text-sm text-cfm-gold hover:underline">

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

      <div className="prose-cfm mt-8 whitespace-pre-wrap text-cfm-earth leading-relaxed">

        {article.content}

      </div>

    </article>

  );

}

