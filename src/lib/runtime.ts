/** Détecte les runtimes sans disque persistant (Netlify, Vercel, Lambda, etc.). */
export function isServerlessRuntime(): boolean {
  return (
    process.env.CFM_SERVERLESS === "true" ||
    Boolean(process.env.VERCEL) ||
    Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME) ||
    Boolean(process.env.NETLIFY)
  );
}
