"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Input } from "@/components/ui/primitives/input";
import { Textarea } from "@/components/ui/primitives/textarea";
import { NativeSelect } from "@/components/ui/primitives/native-select";

const PUSH_TEMPLATES = [
  { label: "Live", topic: "lives", title: "🔴 Live CFM", body: "Rejoignez-nous en direct maintenant !" },
  { label: "Campagne", topic: "campaigns", title: "Nouvelle campagne CFM", body: "Découvrez notre action du moment sur le site." },
  { label: "Aide", topic: "help", title: "Mise à jour dossier", body: "Votre demande d'aide a été traitée." },
];

export type PushForm = { topic: string; title: string; body: string };

type Props = {
  /** Envoie la notification. Le formulaire est réinitialisé ensuite. */
  onSend: (form: PushForm) => Promise<void> | void;
};

/** Formulaire d'envoi de notification push (état local, iso à l'ancien inline). */
export function PushNotificationForm({ onSend }: Props) {
  const [pushForm, setPushForm] = useState<PushForm>({ topic: "lives", title: "", body: "" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await onSend(pushForm);
    setPushForm({ topic: "lives", title: "", body: "" });
  }

  return (
    <section>
      <h2 className="text-lg font-bold">Notification push</h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {PUSH_TEMPLATES.map((tpl) => (
          <button
            key={tpl.label}
            type="button"
            className="rounded border px-2 py-1 text-xs hover:bg-admin-bg"
            onClick={() => setPushForm({ topic: tpl.topic, title: tpl.title, body: tpl.body })}
          >
            {tpl.label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-3 space-y-2 rounded-xl bg-admin-surface p-4 shadow max-w-lg">
        <NativeSelect value={pushForm.topic} onChange={(e) => setPushForm({ ...pushForm, topic: e.target.value })} className="text-sm">
          <option value="lives">Lives</option>
          <option value="campaigns">Campagnes</option>
          <option value="help">Aide / dossiers</option>
        </NativeSelect>
        <Input value={pushForm.title} onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })} placeholder="Titre" required className="text-sm" />
        <Textarea value={pushForm.body} onChange={(e) => setPushForm({ ...pushForm, body: e.target.value })} placeholder="Message" required className="text-sm" rows={2} />
        <Button type="submit" size="sm">Envoyer</Button>
      </form>
    </section>
  );
}
