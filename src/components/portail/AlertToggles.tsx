"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(true);
  return (
    <label className="flex items-center justify-between gap-2.5 border-t border-white/12 py-2.5 text-[13.5px] font-medium">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className={cn("relative h-[22px] w-[38px] shrink-0 transition-colors", on ? "bg-site-light" : "bg-white/25")}
      >
        <span
          className={cn(
            "absolute top-[3px] h-4 w-4 bg-white transition-[left]",
            on ? "left-[19px]" : "left-[3px]"
          )}
        />
      </button>
    </label>
  );
}

export function AlertToggles() {
  return (
    <div className="bg-[#12325f] p-5 text-white">
      <h3 className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.05em] text-site-light">
        Alertes
      </h3>
      <p className="mb-3.5 text-[13.5px] leading-[1.5] text-white/80">
        Recevez les annonces par SMS et WhatsApp, même hors connexion data.
      </p>
      <Toggle label="SMS" />
      <Toggle label="WhatsApp" />
    </div>
  );
}
