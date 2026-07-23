import { after } from "next/server";

/**
 * Exécute un effet de bord APRÈS l'envoi de la réponse HTTP.
 *
 * Sert aux envois d'email : un aller-retour SMTP dans le chemin de requête
 * ajoute sa latence au temps de réponse vu par l'utilisateur (critique lors
 * d'une vague d'inscriptions).
 *
 * `after()` exige un contexte de requête Next.js. Hors de ce contexte (tests
 * unitaires, scripts CLI), il lève : on retombe alors sur une exécution
 * immédiate. Dans les deux cas, une erreur de la tâche est absorbée — elle ne
 * doit jamais remonter à l'appelant.
 */
export function runAfterResponse(task: () => Promise<unknown>): void {
  const guarded = async () => {
    try {
      await task();
    } catch (err) {
      console.error(
        "[CFM] tâche post-réponse en échec :",
        err instanceof Error ? err.message : err
      );
    }
  };

  try {
    after(guarded);
  } catch {
    void guarded();
  }
}
