import fs from "fs";
import path from "path";
import { isServerlessRuntime } from "@/lib/runtime";

export type AdminAuditPayload = {
  actorType: "admin" | "volunteer" | "unknown";
  actorIdentifier?: string | null;
  endpoint: string;
  action: string;
  target?: string | null;
  status: "success" | "denied" | "error";
  ip?: string | null;
  metadata?: Record<string, unknown>;
};

const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "admin-audit.log");

function formatAuditLine(payload: AdminAuditPayload): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

function appendStdoutAudit(payload: AdminAuditPayload): void {
  console.info("[CFM admin-audit]", formatAuditLine(payload));
}

function appendFileAudit(payload: AdminAuditPayload): void {
  if (isServerlessRuntime()) {
    appendStdoutAudit(payload);
    return;
  }

  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${formatAuditLine(payload)}\n`, "utf-8");
  } catch (err) {
    console.warn("[CFM] admin-audit file write failed:", err);
    appendStdoutAudit(payload);
  }
}

async function insertPgAudit(payload: AdminAuditPayload): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  try {
    const pg = await import("pg");
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 2_000,
      max: 1,
    });
    try {
      await pool.query(
        `INSERT INTO admin_audit_log
         (actor_type, actor_identifier, endpoint, action, target, status, ip, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)`,
        [
          payload.actorType,
          payload.actorIdentifier || null,
          payload.endpoint,
          payload.action,
          payload.target || null,
          payload.status,
          payload.ip || null,
          JSON.stringify(payload.metadata || {}),
        ]
      );
    } finally {
      await pool.end();
    }
  } catch {
    // Ne pas bloquer la requête admin si PostgreSQL est indisponible.
  }
}

export async function logAdminAction(payload: AdminAuditPayload): Promise<void> {
  appendFileAudit(payload);
  await insertPgAudit(payload);
}

export type AuditLogEntry = AdminAuditPayload & { timestamp: string };

export async function readAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  const entries: AuditLogEntry[] = [];

  if (!isServerlessRuntime() && fs.existsSync(LOG_FILE)) {
    try {
      const lines = fs.readFileSync(LOG_FILE, "utf-8").trim().split("\n").filter(Boolean);
      for (const line of lines.slice(-limit)) {
        try {
          entries.push(JSON.parse(line) as AuditLogEntry);
        } catch {
          // skip malformed
        }
      }
    } catch {
      // ignore
    }
  }

  if (process.env.DATABASE_URL) {
    try {
      const pg = await import("pg");
      const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
      try {
        const res = await pool.query(
          `SELECT created_at, actor_type, actor_identifier, endpoint, action, target, status, ip, metadata
           FROM admin_audit_log ORDER BY created_at DESC LIMIT $1`,
          [limit]
        );
        const pgEntries: AuditLogEntry[] = res.rows.map((row: Record<string, unknown>) => ({
          timestamp: String(row.created_at),
          actorType: row.actor_type as AdminAuditPayload["actorType"],
          actorIdentifier: row.actor_identifier as string | null,
          endpoint: String(row.endpoint),
          action: String(row.action),
          target: row.target as string | null,
          status: row.status as AdminAuditPayload["status"],
          ip: row.ip as string | null,
          metadata: (row.metadata as Record<string, unknown>) || {},
        }));
        if (pgEntries.length > entries.length) return pgEntries;
      } finally {
        await pool.end();
      }
    } catch {
      // fallback to file
    }
  }

  return entries.reverse();
}
