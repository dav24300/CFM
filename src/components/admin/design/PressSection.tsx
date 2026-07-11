"use client";

import { AdminFileUpload } from "@/components/admin/ui/admin-file-upload";

type Props = {
  pressKitUrl: string;
  onSaved: () => void;
};

export function PressSection({ pressKitUrl, onSaved }: Props) {
  return (
    <div className="max-w-lg space-y-4 rounded-xl border bg-admin-surface p-6">
      <h3 className="font-semibold text-admin-ink">Dossier presse PDF</h3>
      <p className="text-sm text-admin-muted">
        Diffusé sur <code className="text-xs">/presse</code> — téléchargement public.
      </p>
      <p className="truncate text-xs text-admin-muted">{pressKitUrl || "Aucun fichier"}</p>
      {pressKitUrl && (
        <a
          href={pressKitUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-admin-accent hover:underline"
        >
          Ouvrir le PDF actuel
        </a>
      )}
      <AdminFileUpload
        label="Remplacer le PDF"
        accept="application/pdf"
        options={{
          settingKey: "press_kit_url",
          category: "presse",
          subdir: "media/presse",
        }}
        onUploaded={() => onSaved()}
      />
      <p className="text-xs text-green-800">Upload = publication immédiate sur /presse</p>
    </div>
  );
}
