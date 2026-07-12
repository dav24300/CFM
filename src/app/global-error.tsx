"use client";

// Frontière ultime : erreur dans le layout racine lui-même. Doit fournir ses
// propres <html>/<body> (elle remplace tout l'arbre). Styles inline car la CSS
// applicative peut ne pas être appliquée à ce stade.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          background: "#ffffff",
          color: "#14171c",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "26px", fontWeight: 600, margin: 0 }}>
          Une erreur est survenue
        </h1>
        <p style={{ marginTop: "12px", color: "#4a4d54", maxWidth: "28rem" }}>
          L’application a rencontré un problème inattendu. Veuillez réessayer.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "24px",
            background: "#14418a",
            color: "#ffffff",
            padding: "12px 26px",
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
