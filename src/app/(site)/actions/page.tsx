import { ActionsPageClient } from "@/components/actions/ActionsPageClient";
import {
  getActionsHeroImageCached as getActionsHeroImage,
  getResolvedNewsCoverCached as getResolvedNewsCover,
} from "@/infrastructure/cache/media-cache";
import { getActionsCached as getActions } from "@/infrastructure/cache/content-cache";
import { getTranslationsFor } from "@/lib/i18n-server";

export default async function ActionsPage() {
  const { t } = await getTranslationsFor("fr");
  const [heroImage, defaultCover, actions] = await Promise.all([
    getActionsHeroImage(),
    getResolvedNewsCover(null),
    getActions(),
  ]);

  return (
    <ActionsPageClient
      heroImage={heroImage}
      heroAlt={t.pages.actions.heroAlt}
      defaultCover={defaultCover}
      initialActions={actions}
    />
  );
}
