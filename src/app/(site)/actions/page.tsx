import { ActionsPageClient } from "@/components/actions/ActionsPageClient";
import {
  getActionsHeroImage,
  getResolvedNewsCover,
} from "@/lib/media.server";
import { getActions } from "@/lib/db";
import { getTranslations } from "@/lib/i18n-server";

export default async function ActionsPage() {
  const { t } = await getTranslations();
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
