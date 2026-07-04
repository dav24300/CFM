import { NextResponse } from "next/server";
import { isUploadError } from "@/domain/media/upload-errors";

export function jsonUploadError(err: unknown): NextResponse {
  if (isUploadError(err)) {
    return NextResponse.json(
      { error: err.message, code: err.code, hint: err.hint },
      { status: err.status }
    );
  }
  if (err instanceof Error && /ENOENT.*\.next/i.test(err.message)) {
    return NextResponse.json(
      {
        error: "Erreur cache Next.js lors de la publication.",
        code: "UPLOAD_FAILED",
        hint: "Redémarrez le serveur (Ctrl+C puis npm run dev). Si le problème persiste, supprimez le dossier .next.",
      },
      { status: 500 }
    );
  }
  const message = err instanceof Error ? err.message : "Erreur upload";
  return NextResponse.json(
    {
      error: message,
      code: "UPLOAD_FAILED",
      hint: "Réessayez ou contactez le support technique.",
    },
    { status: 500 }
  );
}
