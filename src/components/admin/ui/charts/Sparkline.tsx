import { useId } from "react";

/**
 * Sparkline SVG (ligne + aire dégradée), sans axes. Couleur = `currentColor`
 * → piloter via `text-*` du parent. Étirée par le conteneur (preserveAspectRatio none).
 */
export function Sparkline({
  data,
  className,
  strokeWidth = 2,
  fill = true,
}: {
  data: number[];
  className?: string;
  strokeWidth?: number;
  fill?: boolean;
}) {
  const id = useId();
  if (!data || data.length < 2) return null;

  const W = 100;
  const H = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d - min) / span) * (H - 4) - 2;
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={className} aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={`sk-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#sk-${id})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
