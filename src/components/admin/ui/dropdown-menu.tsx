"use client";

import * as RDropdown from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Menu d'actions (Radix DropdownMenu) stylé sur les tokens admin.
 * Portalé sur <body> — hérite du scope .theme-admin(.dark) posé par AdminThemeSync,
 * donc les tokens admin résolvent (comme les Select/Dialog Radix existants).
 */

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  /** Action au clic (ignorée si `href` fourni). */
  onSelect?: () => void;
  /** Rend l'item comme lien (ex. export CSV) au lieu d'un bouton. */
  href?: string;
  download?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

const CONTENT_CLS =
  "z-[95] min-w-[184px] overflow-hidden rounded-admin-ctrl border border-admin-border bg-admin-surface p-1 shadow-admin-overlay " +
  "data-[state=open]:animate-admin-pop-in motion-reduce:animate-none " +
  "data-[side=top]:origin-bottom data-[side=bottom]:origin-top";

const ITEM_CLS =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-[7px] px-2.5 py-2 text-[13px] font-medium text-admin-ink outline-none " +
  "transition-colors data-[highlighted]:bg-admin-bg data-[disabled]:pointer-events-none data-[disabled]:opacity-45";

export function RowActionsMenu({
  actions,
  label = "Actions",
  align = "end",
}: {
  actions: RowAction[];
  label?: string;
  align?: "start" | "center" | "end";
}) {
  if (!actions.length) return null;
  return (
    <RDropdown.Root>
      <RDropdown.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className="flex h-8 w-8 items-center justify-center rounded-admin-ctrl border border-admin-border text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-ink data-[state=open]:bg-admin-bg data-[state=open]:text-admin-ink"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </RDropdown.Trigger>
      <RDropdown.Portal>
        <RDropdown.Content align={align} sideOffset={6} className={CONTENT_CLS}>
          {actions.map((a, i) => {
            const Icon = a.icon;
            const inner = (
              <>
                {Icon && <Icon className="h-4 w-4 shrink-0 opacity-80" aria-hidden />}
                <span className="flex-1 truncate">{a.label}</span>
              </>
            );
            return (
              <RDropdown.Item
                key={`${a.label}-${i}`}
                disabled={a.disabled}
                onSelect={a.href ? undefined : () => a.onSelect?.()}
                asChild={a.href ? true : undefined}
                className={cn(
                  ITEM_CLS,
                  a.destructive && "text-admin-danger-fg data-[highlighted]:bg-admin-danger-bg"
                )}
              >
                {a.href ? (
                  <a href={a.href} download={a.download}>
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </RDropdown.Item>
            );
          })}
        </RDropdown.Content>
      </RDropdown.Portal>
    </RDropdown.Root>
  );
}

// Réexports stylés pour usages ad hoc (au-delà du kebab de ligne).
export const DropdownMenu = RDropdown.Root;
export const DropdownMenuTrigger = RDropdown.Trigger;
export const DropdownMenuSeparator = () => (
  <RDropdown.Separator className="my-1 h-px bg-admin-border" />
);
export { CONTENT_CLS as dropdownContentClass, ITEM_CLS as dropdownItemClass };
