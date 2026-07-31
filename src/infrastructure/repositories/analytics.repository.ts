import { isPgMode } from "@/infrastructure/persistence/sql/sql-client";
import * as sql from "@/infrastructure/repositories/sql/analytics.sql";

/**
 * Télémétrie CTA — best-effort. Sans PostgreSQL (dev / repli JSON éphémère),
 * on ne persiste rien : la mesure des conversions n'a de sens que sur la cible
 * durable. Ne jamais laisser une erreur de télémétrie remonter au visiteur.
 */

export async function recordCtaEvent(input: { event: string; href: string | null }): Promise<void> {
  if (!isPgMode()) return;
  await sql.recordCtaEvent(input.event, input.href);
}

export async function getCtaCounts(sinceDays = 30): Promise<{ event: string; count: number }[]> {
  if (!isPgMode()) return [];
  return sql.getCtaCounts(sinceDays);
}
