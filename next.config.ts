import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const cspDirectives = [
  // Prod : default-src fermé, chaque besoin est couvert par une directive
  // explicite ci-dessous. Dev : large (HMR, overlays).
  isProd ? "default-src 'self'" : "default-src 'self' https: data: blob:",
  "frame-src 'self' https:", // embeds YouTube/Facebook (live)
  "img-src 'self' https: data: blob:",
  "connect-src 'self' https: wss:", // Pusher (wss), Supabase
  // Aucun <script> externe dans l'app (pusher-js est bundlé, sw.js est même
  // origine) : prod se limite à 'self' + inline Next.js.
  isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
  "style-src 'self' 'unsafe-inline' https:",
  "font-src 'self' https: data:",
  "media-src 'self' https: blob:", // photos/vidéos Supabase Storage
  "worker-src 'self' blob:", // service worker PWA
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
  {
    key: "Content-Security-Policy",
    value: cspDirectives,
  },
];

const nextConfig: NextConfig = {
  // `standalone` sert au self-hosting (Docker/VPS) ; sur Vercel il casse le packaging
  // des fonctions serverless — on le désactive quand VERCEL est présent.
  ...(process.env.VERCEL ? {} : { output: "standalone" as const }),
  serverExternalPackages: ["pg", "bcryptjs", "nodemailer", "web-push", "sharp"],
  experimental: {
    // Transforme les imports barils en imports profonds au build : évite
    // d'évaluer tout le module d'index pour quelques icônes/composants.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // AVIF/WebP servis en priorité, et cache CDN d'un jour au lieu de 60 s
    // (les chemins de médias sont stables et versionnés par l'admin).
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86_400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};
export default nextConfig;
