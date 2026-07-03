/** Normalise les valeurs date PostgreSQL (Date) → chaînes ISO attendues par le domaine. */
export function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export function toDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

export function compareIsoDesc(a: unknown, b: unknown): number {
  return toIsoString(b).localeCompare(toIsoString(a));
}

export function normalizePgRow<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row };
  for (const key of Object.keys(out)) {
    const val = out[key];
    if (val instanceof Date) {
      (out as Record<string, unknown>)[key] =
        key === "date" ? toDateString(val) : toIsoString(val);
    }
  }
  return out;
}

export function normalizePgRows<T extends Record<string, unknown>>(rows: T[]): T[] {
  return rows.map(normalizePgRow);
}
