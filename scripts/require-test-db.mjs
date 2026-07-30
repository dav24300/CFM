#!/usr/bin/env node
/**
 * Garde-fou des tests d'intégration PostgreSQL.
 *
 * Les fichiers *.pg.test.ts sont sous `describe.skipIf(!TEST_DATABASE_URL)`.
 * Sans la variable, ces blocs sont SKIPPÉS et la suite rapporte vert sans jamais
 * toucher au chemin PG — un gate en trompe-l'œil. Ce script échoue explicitement
 * pour rendre le garde-fou réel en local (la CI, elle, fournit toujours la
 * variable via le service postgres). Utilisé par `npm run test:integration`.
 */
if (!process.env.TEST_DATABASE_URL) {
  console.error(
    [
      "❌ TEST_DATABASE_URL manquant.",
      "   Les tests d'intégration PostgreSQL (*.pg.test.ts) seraient SKIPPÉS en silence.",
      "",
      "   Démarrer un Postgres jetable puis relancer, par ex. :",
      "     docker run --rm -d -p 5432:5432 \\",
      "       -e POSTGRES_USER=cfm -e POSTGRES_PASSWORD=cfm_dev_password \\",
      "       -e POSTGRES_DB=cfm_test postgres:16",
      "     TEST_DATABASE_URL=postgresql://cfm:cfm_dev_password@localhost:5432/cfm_test \\",
      "       npm run test:integration",
    ].join("\n")
  );
  process.exit(1);
}

console.log("✓ TEST_DATABASE_URL présent — exécution des tests d'intégration PG");
