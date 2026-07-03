/** Fallback PNG → SVG (client et serveur sans accès fs). */
export function pngToSvgFallback(publicPath: string): string {
  if (!publicPath) return publicPath;
  if (publicPath.endsWith(".svg")) return publicPath;
  if (publicPath.endsWith(".png")) return publicPath.replace(/\.png$/i, ".svg");
  return publicPath;
}

export function resolveMediaPathClient(publicPath: string): string {
  return pngToSvgFallback(publicPath);
}
