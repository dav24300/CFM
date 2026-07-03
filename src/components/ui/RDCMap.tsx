"use client";

import { PROVINCES_RDC } from "@/lib/constants";
import { PROVINCE_MAP_COORDS } from "@/lib/rdc-map-coords";
import { useTranslations } from "@/lib/i18n-client";
import { cn } from "@/lib/utils/cn";

type Props = {
  activeProvinces: string[];
  selected: string | null;
  onSelect: (province: string | null) => void;
};

export function RDCMap({ activeProvinces, selected, onSelect }: Props) {
  const { t } = useTranslations();
  const p = t.pages.actions;
  const activeSet = new Set(activeProvinces);
  const activeList = PROVINCES_RDC.filter((province) => activeSet.has(province));

  return (
    <div className="card">
      <h2 className="font-display text-lg font-bold text-cfm-navy">{p.mapTitle}</h2>
      <p className="mt-1 text-sm text-cfm-earth">
        {activeProvinces.length} {p.mapSubtitle}
      </p>

      <div
        className="relative mx-auto mt-6 aspect-[4/5] max-w-xs"
        role="img"
        aria-label={p.mapAria}
      >
        <svg viewBox="0 0 200 250" className="h-full w-full" aria-hidden>
          <path
            d="M100 20 C130 25 160 40 170 70 C175 100 165 130 155 160 C140 200 120 230 100 240 C80 230 60 200 45 160 C35 130 25 100 30 70 C40 40 70 25 100 20 Z"
            fill="#faf7f2"
            stroke="#1a2f4a"
            strokeWidth="2"
          />
          {PROVINCES_RDC.map((province) => {
            const coords = PROVINCE_MAP_COORDS[province];
            if (!coords) return null;
            const active = activeSet.has(province);
            const isSelected = selected === province;
            return (
              <g key={province}>
                <title>{province}</title>
                <circle
                  cx={coords.cx}
                  cy={coords.cy}
                  r={isSelected ? 9 : active ? 7 : 3}
                  fill={active ? "#c9a227" : "#1a2f4a"}
                  fillOpacity={active ? 1 : 0.15}
                  className={active ? "cursor-pointer transition-all hover:fill-amber-400" : ""}
                  onClick={() => active && onSelect(isSelected ? null : province)}
                  role="button"
                  aria-pressed={isSelected}
                  tabIndex={active ? 0 : -1}
                  onKeyDown={(e) => {
                    if (active && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onSelect(isSelected ? null : province);
                    }
                  }}
                />
              </g>
            );
          })}
        </svg>
      </div>

      <div role="listbox" aria-label={p.mapTitle} className="mt-4">
        <button
          type="button"
          role="option"
          aria-selected={!selected}
          onClick={() => onSelect(null)}
          className={cn(
            "w-full rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-gold",
            !selected ? "bg-cfm-gold font-semibold text-cfm-navy" : "hover:bg-cfm-cream"
          )}
        >
          {p.allProvinces}
        </button>

        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
          {activeList.map((province) => (
            <li key={province}>
              <button
                type="button"
                role="option"
                aria-selected={selected === province}
                onClick={() => onSelect(province)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cfm-gold",
                  selected === province
                    ? "bg-cfm-gold font-semibold text-cfm-navy"
                    : "text-cfm-navy hover:bg-cfm-cream"
                )}
              >
                {province}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
