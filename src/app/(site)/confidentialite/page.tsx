import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { getTranslations } from "@/lib/i18n-server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslations();
  return { title: t.pages.legal.privacyTitle };
}

export default async function ConfidentialitePage() {
  const { t } = await getTranslations();
  const l = t.pages.legal;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="section-title">{l.privacyTitle}</h1>
      <p className="section-subtitle">
        {l.privacySubtitle} — {SITE.sigle}
      </p>

      <div className="mt-8 space-y-6 text-cfm-earth leading-relaxed">
        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">1. Responsable du traitement</h2>
          <p className="mt-2">
            {SITE.name} ({SITE.sigle}), ASBL basée en {SITE.country}, est responsable du traitement
            des données collectées via ce site.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">2. Données collectées</h2>
          <p className="mt-2">Nous collectons les données suivantes selon les formulaires utilisés :</p>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Identité (nom, prénom)</li>
            <li>Coordonnées (email, téléphone, province)</li>
            <li>Informations sur le lien familial militaire (adhésion famille uniquement)</li>
            <li>Demandes d&apos;aide confidentielles (statut, besoins, description)</li>
            <li>Données relatives aux mineurs (âge, consentement parental)</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">3. Finalités</h2>
          <ul className="mt-2 list-disc pl-6 space-y-1">
            <li>Traitement des demandes d&apos;adhésion et d&apos;aide</li>
            <li>Plaidoyer et accompagnement des familles militaires</li>
            <li>Communication (newsletter, avec consentement)</li>
            <li>Transparence envers les donateurs</li>
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">4. Données sensibles</h2>
          <p className="mt-2">
            Les demandes d&apos;aide et informations sur le statut militaire familial sont traitées
            de manière <strong>strictement confidentielle</strong>. L&apos;accès est limité aux
            membres autorisés de l&apos;équipe CFM.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">5. Protection des mineurs</h2>
          <p className="mt-2">
            Pour toute personne de moins de 18 ans, le consentement parental est requis avant
            le traitement de la demande. Les données des mineurs font l&apos;objet d&apos;une
            protection renforcée.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">6. Conservation</h2>
          <p className="mt-2">
            Les données sont conservées pendant la durée nécessaire aux finalités poursuivies,
            puis supprimées ou anonymisées conformément à la réglementation applicable.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">7. Vos droits</h2>
          <p className="mt-2">
            Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos
            données. Contactez-nous à {SITE.email}.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">8. Cookies</h2>
          <p className="mt-2">
            Ce site utilise uniquement des cookies techniques nécessaires au fonctionnement
            (session administrateur). Aucun cookie publicitaire n&apos;est utilisé en V1.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-cfm-navy">9. Modération</h2>
          <p className="mt-2">
            Les commentaires publics ne sont pas activés en V1. Toute fonctionnalité interactive
            future fera l&apos;objet d&apos;une modération pour protéger les utilisateurs, notamment les mineurs.
          </p>
        </section>
      </div>
    </div>
  );
}
