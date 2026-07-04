import { ActionsPageClient } from "@/components/actions/ActionsPageClient";
import {
  getActionsHeroImage,
  getResolvedNewsCover,
} from "@/lib/media.server";
import { getTranslations } from "@/lib/i18n-server";

export default async function ActionsPage() {
  const { t } = await getTranslations();
  const heroImage = await getActionsHeroImage();
  const defaultCover = await getResolvedNewsCover(null);

  return (
    <ActionsPageClient
      heroImage={heroImage}
      heroAlt={t.pages.actions.heroAlt}
      defaultCover={defaultCover}
    />
  );
}
