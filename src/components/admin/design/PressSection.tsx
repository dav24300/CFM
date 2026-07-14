"use client";

import { MediaSlot } from "@/components/admin/design/MediaSlot";

type Props = {
  pressKitUrl: string;
  onSaved: () => void;
};

export function PressSection({ pressKitUrl, onSaved }: Props) {
  return (
    <MediaSlot
      label="Dossier presse (PDF)"
      value={pressKitUrl}
      kind="pdf"
      accept="application/pdf"
      uploadLabel="Remplacer le PDF"
      uploadOptions={{ settingKey: "press_kit_url", category: "presse", subdir: "media/presse" }}
      onUploaded={() => onSaved()}
      siteHref="/presse"
      help="Diffusé en téléchargement public sur /presse."
      className="max-w-lg"
    />
  );
}
