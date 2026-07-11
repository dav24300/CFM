/**
 * Hook Next.js exécuté au démarrage du serveur (runtime), quel que soit le
 * backend de persistance. Rend le garde-fou de configuration production
 * inconditionnel : sur la cible Postgres, assertProductionConfig() n'était
 * jamais atteint (il ne l'était que via le store JSON), laissant passer des
 * secrets par défaut. On le déclenche ici pour un échec-au-démarrage explicite.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionConfig } = await import("@/lib/config");
    assertProductionConfig();
  }
}
