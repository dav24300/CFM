import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/infrastructure/auth/member-auth";
import {
  getMessagesForUser,
  markMessagesRead,
} from "@/infrastructure/repositories/messages.repository";
import { PortalPage, PortalEmpty } from "@/components/portail/PortalPage";
import { MessageComposer } from "@/components/portail/MessageComposer";

export const metadata: Metadata = { title: "Portail — Messagerie" };

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PortailMessagesPage() {
  const member = await getCurrentMember();
  if (!member) redirect("/membre/connexion");

  await markMessagesRead(member.id);
  const messages = await getMessagesForUser(member.id);

  return (
    <PortalPage
      title="Messagerie"
      subtitle="Échangez directement avec votre référent CFM — réponse sous 48h."
    >
      <div className="mx-auto flex max-w-2xl flex-col">
        <div className="flex flex-col gap-4 border border-site-hairline bg-site-surface p-5">
          {messages.length === 0 ? (
            <PortalEmpty>
              Aucun message pour l’instant. Écrivez à votre référent ci-dessous.
            </PortalEmpty>
          ) : (
            messages.map((m) => {
              const isOut = m.direction === "out";
              return (
                <div
                  key={m.id}
                  className={
                    isOut ? "flex flex-col items-end" : "flex flex-col items-start"
                  }
                >
                  <div
                    className={
                      isOut
                        ? "max-w-[78%] border border-site-primary/20 bg-site-primary/10 px-4 py-3"
                        : "max-w-[78%] border border-site-hairline bg-white px-4 py-3"
                    }
                  >
                    <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold text-site-ink">
                      <span>{m.author_name}</span>
                      <span className="font-normal text-site-muted-2">
                        {formatDate(m.created_at)}
                      </span>
                    </div>
                    {m.subject && (
                      <div className="mb-1 text-[13px] font-semibold text-site-ink">
                        {m.subject}
                      </div>
                    )}
                    <p className="whitespace-pre-wrap text-[13.5px] leading-[1.5] text-site-muted">
                      {m.body}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4">
          <MessageComposer />
        </div>
      </div>
    </PortalPage>
  );
}
