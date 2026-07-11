import "server-only";
import type { HelpRequestUpdate } from "@/domain/entities/v2";
import { normalizePgRows } from "@/infrastructure/persistence/normalize-pg-row";
import { mapPgError } from "@/infrastructure/persistence/sql/pg-errors";
import { query, withTransaction } from "@/infrastructure/persistence/sql/sql-client";

/**
 * Agrégat « formulaires » en SQL ciblé (mode PG) :
 * contact_messages, memberships, help_requests, help_request_updates.
 *
 * Comme pour le sync legacy (pg-sync TABLE_SPECS), l'objet ENTIER est stocké
 * en JSONB dans la colonne `data` (id/status/created_at inclus), les colonnes
 * id/status/created_at étant extraites du même objet. Le chiffrement AES des
 * champs sensibles reste chez les appelants — ici on ne touche pas au contenu.
 *
 * Les ids proviennent des séquences par table (nextval explicite dans une
 * transaction) afin que l'id de la colonne et celui embarqué dans `data`
 * soient identiques.
 */

type FormRecord = Record<string, unknown>;

export async function addMembership(data: {
  type: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  province?: string;
  military_link?: string;
  parent_military_name?: string;
  skills?: string;
  message?: string;
}): Promise<void> {
  await withTransaction(async (client) => {
    const seq = await client.query<{ id: number }>(
      "SELECT nextval('memberships_id_seq')::int AS id"
    );
    const record: FormRecord = {
      id: seq.rows[0].id,
      ...data,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    await client.query(
      "INSERT INTO memberships (id, data, created_at) VALUES ($1, $2, $3)",
      [record.id, JSON.stringify(record), record.created_at]
    );
  }).catch((err) => mapPgError(err));
}

export async function addHelpRequest(data: FormRecord): Promise<void> {
  await withTransaction(async (client) => {
    const seq = await client.query<{ id: number }>(
      "SELECT nextval('help_requests_id_seq')::int AS id"
    );
    const record: FormRecord = {
      id: seq.rows[0].id,
      ...data,
      status: "new",
      created_at: new Date().toISOString(),
    };
    await client.query(
      "INSERT INTO help_requests (id, status, data, created_at) VALUES ($1, $2, $3, $4)",
      [record.id, record.status, JSON.stringify(record), record.created_at]
    );
  }).catch((err) => mapPgError(err));
}

export async function addContactMessage(data: {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: string;
}): Promise<void> {
  await withTransaction(async (client) => {
    const seq = await client.query<{ id: number }>(
      "SELECT nextval('contact_messages_id_seq')::int AS id"
    );
    const record: FormRecord = {
      id: seq.rows[0].id,
      ...data,
      status: "new",
      created_at: new Date().toISOString(),
    };
    await client.query(
      "INSERT INTO contact_messages (id, data, created_at) VALUES ($1, $2, $3)",
      [record.id, JSON.stringify(record), record.created_at]
    );
  }).catch((err) => mapPgError(err));
}

export async function updateContactStatus(
  id: number,
  status: "new" | "read" | "archived"
): Promise<boolean> {
  try {
    const res = await query(
      "UPDATE contact_messages SET data = jsonb_set(data, '{status}', to_jsonb($2::text)) WHERE id = $1",
      [id, status]
    );
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    mapPgError(err);
  }
}

/** Statut colonne ET statut embarqué dans data restent synchronisés. */
export async function adminUpdateStatus(
  table: string,
  id: number,
  status: string
): Promise<void> {
  try {
    if (table === "memberships") {
      await query(
        "UPDATE memberships SET data = jsonb_set(data, '{status}', to_jsonb($2::text)) WHERE id = $1",
        [id, status]
      );
    } else if (table === "help_requests") {
      await query(
        "UPDATE help_requests SET status = $2::text, data = jsonb_set(data, '{status}', to_jsonb($2::text)) WHERE id = $1",
        [id, status]
      );
    }
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Ajoute un suivi de dossier ET synchronise le statut de la demande d'aide
 * dans la même transaction (parité avec la mutation Store unique).
 * Parité Store : demande introuvable → pas d'erreur (la FK interdit ici
 * l'update orphelin que la branche Store aurait conservé ; rien n'est écrit).
 */
export async function addHelpRequestUpdate(data: {
  help_request_id: number;
  status: string;
  note: string;
  updated_by: string;
}): Promise<HelpRequestUpdate> {
  return withTransaction(async (client) => {
    const seq = await client.query<{ id: number }>(
      "SELECT nextval('help_request_updates_id_seq')::int AS id"
    );
    const created: HelpRequestUpdate = {
      id: seq.rows[0].id,
      help_request_id: data.help_request_id,
      status: data.status,
      note: data.note,
      updated_by: data.updated_by,
      created_at: new Date().toISOString(),
    };
    const parent = await client.query(
      "SELECT id FROM help_requests WHERE id = $1 FOR UPDATE",
      [data.help_request_id]
    );
    if (parent.rowCount === 0) return created;
    await client.query(
      `INSERT INTO help_request_updates (id, help_request_id, status, note, updated_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        created.id,
        created.help_request_id,
        created.status,
        created.note,
        created.updated_by,
        created.created_at,
      ]
    );
    await client.query(
      "UPDATE help_requests SET status = $2::text, data = jsonb_set(data, '{status}', to_jsonb($2::text)) WHERE id = $1",
      [data.help_request_id, data.status]
    );
    return created;
  }).catch((err) => mapPgError(err));
}

export async function getHelpRequestUpdates(
  helpRequestId: number
): Promise<HelpRequestUpdate[]> {
  try {
    const res = await query<HelpRequestUpdate>(
      "SELECT * FROM help_request_updates WHERE help_request_id = $1 ORDER BY id",
      [helpRequestId]
    );
    return normalizePgRows(res.rows);
  } catch (err) {
    mapPgError(err);
  }
}

/**
 * Assigne une demande d'aide à un bénévole (UPDATE unique, concurrent-safe) :
 * le WHERE reproduit hasAssignedVolunteer (clé absente, null ou "").
 */
export async function claimHelpRequest(
  id: number,
  volunteerId: number,
  volunteerName: string
): Promise<boolean> {
  try {
    const res = await query(
      `UPDATE help_requests
       SET status = 'in_progress',
           data = data || jsonb_build_object(
             'assigned_volunteer_id', $2::int,
             'assigned_volunteer_name', $3::text,
             'status', 'in_progress'
           )
       WHERE id = $1
         AND (data->>'assigned_volunteer_id' IS NULL OR data->>'assigned_volunteer_id' = '')`,
      [id, volunteerId, volunteerName]
    );
    return (res.rowCount ?? 0) > 0;
  } catch (err) {
    mapPgError(err);
  }
}

/** Objet complet (non déchiffré) d'une demande d'aide. */
export async function getHelpRequestById(id: number): Promise<FormRecord | undefined> {
  try {
    const res = await query<{ data: FormRecord }>(
      "SELECT data FROM help_requests WHERE id = $1",
      [id]
    );
    return res.rows[0]?.data;
  } catch (err) {
    mapPgError(err);
  }
}

/** Demandes d'aide brutes (non déchiffrées), ordre d'insertion (id ASC). */
export async function listHelpRequestsRaw(): Promise<FormRecord[]> {
  try {
    const res = await query<{ data: FormRecord }>(
      "SELECT data FROM help_requests ORDER BY id"
    );
    return res.rows.map((r) => r.data);
  } catch (err) {
    mapPgError(err);
  }
}

/** Liste id DESC — équivalent du [...store.memberships].reverse() historique. */
export async function listMembershipsDesc(): Promise<FormRecord[]> {
  try {
    const res = await query<{ data: FormRecord }>(
      "SELECT data FROM memberships ORDER BY id DESC"
    );
    return res.rows.map((r) => r.data);
  } catch (err) {
    mapPgError(err);
  }
}

/** Liste id DESC (non déchiffrée — decryptHelpRequest reste chez l'appelant). */
export async function listHelpRequestsDesc(): Promise<FormRecord[]> {
  try {
    const res = await query<{ data: FormRecord }>(
      "SELECT data FROM help_requests ORDER BY id DESC"
    );
    return res.rows.map((r) => r.data);
  } catch (err) {
    mapPgError(err);
  }
}

/** Liste id DESC — équivalent du [...store.contact_messages].reverse(). */
export async function listContactMessagesDesc(): Promise<FormRecord[]> {
  try {
    const res = await query<{ data: FormRecord }>(
      "SELECT data FROM contact_messages ORDER BY id DESC"
    );
    return res.rows.map((r) => r.data);
  } catch (err) {
    mapPgError(err);
  }
}

/** Dates de création (created_at embarqués dans data) des formulaires reçus. */
export async function getFormsActivityDates(): Promise<{
  help: string[];
  memberships: string[];
  contacts: string[];
}> {
  try {
    const [help, memberships, contacts] = await Promise.all([
      query<{ created_at: string }>(
        "SELECT data->>'created_at' AS created_at FROM help_requests ORDER BY id"
      ),
      query<{ created_at: string }>(
        "SELECT data->>'created_at' AS created_at FROM memberships ORDER BY id"
      ),
      query<{ created_at: string }>(
        "SELECT data->>'created_at' AS created_at FROM contact_messages ORDER BY id"
      ),
    ]);
    return {
      help: help.rows.map((r) => r.created_at),
      memberships: memberships.rows.map((r) => r.created_at),
      contacts: contacts.rows.map((r) => r.created_at),
    };
  } catch (err) {
    mapPgError(err);
  }
}

/** Compteurs formulaires pour le tableau de bord admin. */
export async function getFormsAdminCounters(): Promise<{
  memberships: number;
  help_requests: number;
  contacts: number;
  pending_memberships: number;
  new_help: number;
}> {
  try {
    const [memberships, helpRequests, contacts, pending, newHelp] = await Promise.all([
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM memberships"),
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM help_requests"),
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM contact_messages"),
      query<{ n: number }>(
        "SELECT COUNT(*)::int AS n FROM memberships WHERE data->>'status' = 'pending'"
      ),
      query<{ n: number }>("SELECT COUNT(*)::int AS n FROM help_requests WHERE status = 'new'"),
    ]);
    return {
      memberships: memberships.rows[0].n,
      help_requests: helpRequests.rows[0].n,
      contacts: contacts.rows[0].n,
      pending_memberships: pending.rows[0].n,
      new_help: newHelp.rows[0].n,
    };
  } catch (err) {
    mapPgError(err);
  }
}
