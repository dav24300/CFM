import type { Metadata } from "next";
import { AnchorButton, ButtonLink } from "@/components/ui/patterns/button-link";
import fs from "fs";
import path from "path";
import { getPublishedPressReleases } from "@/lib/db";

import { SITE } from "@/lib/constants";

import { Download, Newspaper, Mail } from "lucide-react";

import { getTranslations } from "@/lib/i18n-server";

import { dateLocale } from "@/lib/i18n-supplement";



const PRESS_KIT_PATH = "/media/presse/dossier-presse.pdf";



function pressKitAvailable(): boolean {

  const full = path.join(process.cwd(), "public", PRESS_KIT_PATH.replace(/^\//, ""));

  return fs.existsSync(full);

}



export async function generateMetadata(): Promise<Metadata> {

  const { t } = await getTranslations();

  return { title: t.pages.press.title };

}



export default async function PressePage() {

  const { locale, t } = await getTranslations();

  const p = t.pages.press;

  const releases = await getPublishedPressReleases();

  const hasPressKit = pressKitAvailable();



  return (

    <div className="mx-auto max-w-6xl px-4 py-12">

      <h1 className="section-title">{p.title}</h1>

      <p className="section-subtitle max-w-3xl">{p.subtitle}</p>



      <div className="mt-10 grid gap-6 md:grid-cols-3">

        <div className="card text-center">

          <Newspaper className="mx-auto h-10 w-10 text-cfm-gold" aria-hidden />

          <h3 className="mt-4 font-display text-lg font-bold">{p.pressKitTitle}</h3>

          <p className="mt-2 text-sm text-cfm-earth">{p.pressKitDesc}</p>

          {hasPressKit ? (

            <AnchorButton
              href={PRESS_KIT_PATH}
              download
              variant="secondary"
              size="sm"
              className="mt-4 inline-flex items-center"
            >

              <Download className="mr-2 h-4 w-4" />

              {p.downloadPdf}

            </AnchorButton>

          ) : (

            <p className="mt-4 text-xs text-cfm-earth">

              <code>{p.pressKitHint}</code>

            </p>

          )}

        </div>

        <div className="card text-center">

          <Mail className="mx-auto h-10 w-10 text-cfm-gold" aria-hidden />

          <h3 className="mt-4 font-display text-lg font-bold">{p.contactPress}</h3>

          <p className="mt-2 text-sm text-cfm-earth">{SITE.email}</p>

          <ButtonLink href="/contact" size="sm" className="mt-4">
            {p.contactBtn}
          </ButtonLink>
        </div>

        <div className="card text-center">

          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-cfm-gold text-cfm-navy font-bold">

            CFM

          </div>

          <h3 className="mt-4 font-display text-lg font-bold">{p.aboutCardTitle}</h3>

          <p className="mt-2 text-sm text-cfm-earth">

            {p.aboutCardDesc.replace("{year}", String(SITE.founded))}

          </p>

          <ButtonLink href="/a-propos" variant="secondary" size="sm" className="mt-4">
            {p.learnMore}
          </ButtonLink>
        </div>

      </div>



      <section className="mt-16">

        <h2 className="font-display text-2xl font-bold">{p.releasesTitle}</h2>

        <div className="mt-6 space-y-4">

          {releases.map((release) => (

            <article key={release.slug} className="card">

              <time className="text-xs text-gray-500">

                {new Date(release.created_at).toLocaleDateString(dateLocale(locale), {

                  year: "numeric",

                  month: "long",

                  day: "numeric",

                })}

              </time>

              <h3 className="mt-1 font-display text-xl font-bold">{release.title}</h3>

              <p className="mt-2 text-cfm-earth">{release.content}</p>

              {release.file_url && (

                <AnchorButton
                  href={release.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                >
                  {p.downloadRelease}
                </AnchorButton>
              )}

            </article>

          ))}

        </div>

      </section>

    </div>

  );

}

