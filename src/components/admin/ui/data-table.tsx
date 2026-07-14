"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Inbox,
} from "lucide-react";
import { Input } from "@/components/ui/primitives/input";
import { Skeleton } from "@/components/ui/primitives/skeleton";
import { RowActionsMenu, type RowAction } from "@/components/admin/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
};

export type FilterChip = {
  label: string;
  active?: boolean;
  onClick: () => void;
  count?: number;
};

type Props<T> = {
  data: T[];
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  pageSize?: number;
  emptyMessage?: string;
  rowKey: (row: T) => string | number;
  actions?: (row: T) => React.ReactNode;
  // — Extensions premium (toutes optionnelles, rétro-compatibles) —
  /** Titre + sous-titre affichés dans le bandeau de la carte. */
  title?: string;
  description?: string;
  /** Affiche des lignes squelette au lieu des données. */
  loading?: boolean;
  /** Placeholder du champ de recherche (défaut « Rechercher… »). */
  searchPlaceholder?: string;
  /** Contenu additionnel de la barre d'outils (ex. filtre externe), aligné à droite. */
  toolbar?: React.ReactNode;
  /** Puces de filtre rapides. */
  filterChips?: FilterChip[];
  /** Actions de ligne en menu kebab (alternative à `actions`). Prioritaire si fourni. */
  rowActions?: (row: T) => RowAction[];
  /** Active la colonne de sélection + la barre d'actions groupées. */
  selectable?: boolean;
  /** Rendu des actions groupées, reçoit les lignes sélectionnées. */
  bulkActions?: (rows: T[]) => React.ReactNode;
  /** État vide riche (remplace `emptyMessage`). */
  emptyState?: React.ReactNode;
  /** Hauteur max du corps → scroll vertical + en-tête collant. */
  maxHeight?: string;
};

const SKELETON_WIDTHS = ["w-3/4", "w-1/2", "w-2/3", "w-2/5", "w-4/5", "w-1/3"];

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  searchKeys = [],
  pageSize = 10,
  emptyMessage = "Aucun élément",
  rowKey,
  actions,
  title,
  description,
  loading = false,
  searchPlaceholder = "Rechercher…",
  toolbar,
  filterChips,
  rowActions,
  selectable = false,
  bulkActions,
  emptyState,
  maxHeight,
}: Props<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string | number>>(new Set());

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search.trim() && searchKeys.length) {
      const q = search.toLowerCase();
      rows = rows.filter((row) =>
        searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      rows.sort((a, b) => {
        const av = String(a[sortKey] ?? "");
        const bv = String(b[sortKey] ?? "");
        const cmp = av.localeCompare(bv, "fr", { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const pageRows = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const hasActionsCol = Boolean(rowActions || actions);
  const totalCols = columns.length + (selectable ? 1 : 0) + (hasActionsCol ? 1 : 0);

  const pageKeys = pageRows.map(rowKey);
  const allOnPage = pageKeys.length > 0 && pageKeys.every((k) => selected.has(k));
  const someOnPage = pageKeys.some((k) => selected.has(k));
  const selectedRows = useMemo(
    () => filtered.filter((r) => selected.has(rowKey(r))),
    [filtered, selected, rowKey]
  );

  // Réconcilie la sélection avec les données : purge les clés disparues (après
  // suppression groupée p.ex.) pour que compteur et barre suivent la réalité.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const live = new Set(data.map(rowKey));
      let changed = false;
      const next = new Set<string | number>();
      prev.forEach((k) => {
        if (live.has(k)) next.add(k);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [data, rowKey]);

  function toggleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleRow(key: string | number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPage) pageKeys.forEach((k) => next.delete(k));
      else pageKeys.forEach((k) => next.add(k));
      return next;
    });
  }

  const showSearch = searchKeys.length > 0;
  const showChips = Boolean(filterChips && filterChips.length);
  const showHeaderBand = Boolean(title || showSearch || showChips || toolbar);
  const bulkActive = selectable && bulkActions && selectedRows.length > 0;

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-admin-card border border-admin-border bg-admin-surface shadow-admin-rest">
        {/* Barre d'actions groupées (remplace le bandeau quand sélection active) */}
        {bulkActive ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border bg-admin-accent/[0.07] px-4 py-2.5 animate-admin-pop-in motion-reduce:animate-none">
            <div className="flex items-center gap-2 text-[13px] font-medium text-admin-ink">
              <span className="font-display font-bold text-admin-accent">{selectedRows.length}</span>
              sélectionné{selectedRows.length > 1 ? "s" : ""}
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="ml-1 text-[12px] font-medium text-admin-muted-2 underline underline-offset-2 hover:text-admin-ink"
              >
                Désélectionner
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">{bulkActions?.(selectedRows)}</div>
          </div>
        ) : (
          showHeaderBand && (
            <div className="space-y-3 border-b border-admin-border px-4 py-3">
              {title && (
                <div>
                  <h3 className="font-display text-admin-h3 font-semibold text-admin-ink">{title}</h3>
                  {description && <p className="mt-0.5 text-[12.5px] text-admin-muted">{description}</p>}
                </div>
              )}
              {(showSearch || showChips || toolbar) && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {showSearch && (
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-admin-muted-2" />
                        <Input
                          placeholder={searchPlaceholder}
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                          }}
                          className="w-full min-w-[200px] py-2 pl-9 text-sm sm:w-64"
                          aria-label="Rechercher dans le tableau"
                        />
                      </div>
                    )}
                    {showChips &&
                      filterChips!.map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={chip.onClick}
                          aria-pressed={chip.active}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                            chip.active
                              ? "border-admin-accent/40 bg-admin-accent/10 text-admin-accent"
                              : "border-admin-border text-admin-muted hover:bg-admin-bg hover:text-admin-ink"
                          )}
                        >
                          {chip.label}
                          {chip.count != null && (
                            <span className="opacity-70">{chip.count}</span>
                          )}
                        </button>
                      ))}
                  </div>
                  {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
                </div>
              )}
            </div>
          )
        )}

        {/* Tableau */}
        <div
          className={cn("overflow-x-auto", maxHeight && "overflow-y-auto")}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-admin-muted">
              <tr>
                {selectable && (
                  <th className="sticky top-0 z-10 w-10 border-b border-admin-border bg-admin-bg px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      ref={(el) => {
                        if (el) el.indeterminate = !allOnPage && someOnPage;
                      }}
                      onChange={toggleAllOnPage}
                      aria-label="Tout sélectionner sur la page"
                      className="h-4 w-4 cursor-pointer rounded border-admin-border accent-admin-accent"
                    />
                  </th>
                )}
                {columns.map((col) => {
                  const sorted = sortKey === col.key;
                  return (
                    <th
                      key={col.key}
                      aria-sort={
                        col.sortable
                          ? sorted
                            ? sortDir === "asc"
                              ? "ascending"
                              : "descending"
                            : "none"
                          : undefined
                      }
                      className={cn(
                        "sticky top-0 z-10 border-b border-admin-border bg-admin-bg px-4 py-3 font-semibold",
                        col.className
                      )}
                    >
                      {col.sortable ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          aria-label={`Trier par ${col.header}${sorted ? (sortDir === "asc" ? " (croissant)" : " (décroissant)") : ""}`}
                          className="group inline-flex items-center gap-1 transition-colors hover:text-admin-ink"
                        >
                          {col.header}
                          {sorted ? (
                            sortDir === "asc" ? (
                              <ChevronUp className="h-3.5 w-3.5 text-admin-accent" aria-hidden />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5 text-admin-accent" aria-hidden />
                            )
                          ) : (
                            <ChevronsUpDown className="h-3.5 w-3.5 opacity-40 transition-opacity group-hover:opacity-70" aria-hidden />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
                {hasActionsCol && (
                  <th className="sticky top-0 z-10 border-b border-admin-border bg-admin-bg px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: Math.min(pageSize, 6) }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-admin-border last:border-0">
                    {selectable && (
                      <td className="px-4 py-3.5">
                        <Skeleton variant="rect" className="h-4 w-4" />
                      </td>
                    )}
                    {columns.map((col, ci) => (
                      <td key={col.key} className="px-4 py-3.5">
                        <Skeleton className={cn("h-4", SKELETON_WIDTHS[(i + ci) % SKELETON_WIDTHS.length])} />
                      </td>
                    ))}
                    {hasActionsCol && (
                      <td className="px-4 py-3.5">
                        <Skeleton variant="rect" className="ml-auto h-8 w-8" />
                      </td>
                    )}
                  </tr>
                ))
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={totalCols} className="px-4 py-12">
                    {!search.trim() && emptyState ? (
                      emptyState
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-admin-bg text-admin-muted-2">
                          <Inbox className="h-5 w-5" />
                        </div>
                        <p className="text-sm text-admin-muted">
                          {search.trim() ? "Aucun résultat pour cette recherche." : emptyMessage}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => {
                  const key = rowKey(row);
                  const isSel = selected.has(key);
                  return (
                    <tr
                      key={key}
                      className={cn(
                        "border-b border-admin-border transition-colors last:border-0 hover:bg-admin-bg/60",
                        isSel && "bg-admin-accent/[0.06]"
                      )}
                    >
                      {selectable && (
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleRow(key)}
                            aria-label="Sélectionner la ligne"
                            className="h-4 w-4 cursor-pointer rounded border-admin-border accent-admin-accent"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td key={col.key} className={cn("px-4 py-3.5 text-admin-ink", col.className)}>
                          {col.render ? col.render(row) : String(row[col.key] ?? "—")}
                        </td>
                      ))}
                      {hasActionsCol && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            {rowActions ? <RowActionsMenu actions={rowActions(row)} /> : actions?.(row)}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && filtered.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-admin-muted">
          <span>
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""} — page {currentPage + 1}/{totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
              className="rounded-admin-ctrl border border-admin-border px-3 py-1.5 font-medium text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-ink disabled:pointer-events-none disabled:opacity-40"
            >
              Préc.
            </button>
            <button
              type="button"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setPage(currentPage + 1)}
              className="rounded-admin-ctrl border border-admin-border px-3 py-1.5 font-medium text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-ink disabled:pointer-events-none disabled:opacity-40"
            >
              Suiv.
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
