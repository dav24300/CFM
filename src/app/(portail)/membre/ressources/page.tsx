import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import { getResourcesByCategory } from "@/infrastructure/repositories/resources.repository";
import { PortalPage, PortalEmpty } from "@/components/portail/PortalPage";
import type { MemberResource } from "@/domain/entities/v4";

export const metadata: Metadata = { title: "Portail — Ressources & démarches" };

/** Ordre d'affichage privilégié des catégories connues. */
const CATEGORY_ORDER = [
  "Démarches",
  "Éducation",
  "Santé",
  "Juridique",
  "Économique",
];

function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, "fr");
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

function DocIcon() {
  return (
    <span className="flex h-10 w-10 items-center justify-center bg-site-pale text-site-primary">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 3h9l4 4v14H6z" />
        <path d="M14 3v5h5" />
      </svg>
    </span>
  );
}

function ResourceCard({ resource }: { resource: MemberResource }) {
  return (
    <article className="flex flex-col border border-site-hairline bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <DocIcon />
        {resource.category && (
          <span className="inline-flex bg-site-pale px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-site-primary">
            {resource.category}
          </span>
        )}
      </div>
      <h3 className="font-serif text-lg font-medium leading-[1.3] text-site-ink">
        {resource.title}
      </h3>
      <p className="mt-1.5 flex-1 text-[13.5px] leading-[1.55] text-site-muted">
        {resource.description}
      </p>
      <div className="mt-4">
        {resource.file_url ? (
          <a
            href={resource.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-semibold text-site-primary transition hover:text-site-deep"
          >
            Télécharger →
          </a>
        ) : resource.external_url ? (
          <a
            href={resource.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-semibold text-site-primary transition hover:text-site-deep"
          >
            Ouvrir →
          </a>
        ) : (
          <Link
            href="/membre/messages"
            className="text-[13px] font-semibold text-site-primary transition hover:text-site-deep"
          >
            Nous contacter →
          </Link>
        )}
      </div>
    </article>
  );
}

export default async function PortailRessourcesPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/membre/connexion");

  const grouped = await getResourcesByCategory();
  const categories = sortCategories(Object.keys(grouped));

  return (
    <PortalPage
      title="Ressources & démarches"
      subtitle="Guides, modèles et documents pour vous accompagner au quotidien."
    >
      {categories.length === 0 ? (
        <PortalEmpty>Aucune ressource disponible pour le moment.</PortalEmpty>
      ) : (
        <div className="flex flex-col gap-10">
          {categories.map((category) => (
            <section key={category}>
              <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.05em] text-site-muted">
                {category} ({grouped[category].length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped[category].map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </PortalPage>
  );
}
