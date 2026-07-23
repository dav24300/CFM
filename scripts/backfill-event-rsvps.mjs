#!/usr/bin/env node
/**
 * Migration des inscriptions aux événements : events.rsvp_user_ids (JSONB)
 * → table event_rsvps.
 *
 * Volontairement HORS de scripts/schema.sql, qui est rejoué à chaque démarrage
 * de l'application : un backfill doit être joué explicitement, une fois, avant
 * le déploiement du code applicatif qui lit la nouvelle table.
 *
 * Idempotent (ON CONFLICT DO NOTHING) et RÉVERSIBLE : la colonne
 * rsvp_user_ids n'est jamais vidée. Pour revenir en arrière, il suffit de
 * redéployer le code précédent — les données d'origine sont intactes.
 *
 * Usage : DATABASE_URL=... node scripts/backfill-event-rsvps.mjs [--verify]
 */
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

const verifyOnly = process.argv.includes("--verify");
const pool = new pg.Pool({ connectionString: databaseUrl });

async function main() {
  const { rows: existing } = await pool.query(
    "SELECT to_regclass('public.event_rsvps') IS NOT NULL AS ok"
  );
  if (!existing[0].ok) {
    console.error(
      "Table event_rsvps absente : appliquer d'abord scripts/schema.sql (npm run bootstrap:pg)."
    );
    process.exit(1);
  }

  // Ce que contient le JSONB, aplati — en ignorant les identifiants qui ne
  // correspondent à aucun utilisateur (la colonne n'avait aucune contrainte
  // de clé étrangère, elle peut contenir des références mortes).
  const SOURCE = `
    SELECT e.id AS event_id, (u.value)::int AS user_id
    FROM events e, jsonb_array_elements(COALESCE(e.rsvp_user_ids, '[]'::jsonb)) AS u(value)
    WHERE jsonb_typeof(e.rsvp_user_ids) = 'array'
      AND EXISTS (SELECT 1 FROM users usr WHERE usr.id = (u.value)::int)
  `;

  const attendu = await pool.query(`SELECT count(*)::int AS n FROM (${SOURCE}) s`);
  const orphelins = await pool.query(`
    SELECT count(*)::int AS n
    FROM events e, jsonb_array_elements(COALESCE(e.rsvp_user_ids, '[]'::jsonb)) AS u(value)
    WHERE jsonb_typeof(e.rsvp_user_ids) = 'array'
      AND NOT EXISTS (SELECT 1 FROM users usr WHERE usr.id = (u.value)::int)
  `);

  if (verifyOnly) {
    const presentes = await pool.query("SELECT count(*)::int AS n FROM event_rsvps");
    console.log(`source (JSONB, utilisateurs existants) : ${attendu.rows[0].n}`);
    console.log(`table event_rsvps                      : ${presentes.rows[0].n}`);
    console.log(`références mortes ignorées             : ${orphelins.rows[0].n}`);
    console.log(
      presentes.rows[0].n >= attendu.rows[0].n
        ? "✓ backfill complet"
        : "✗ backfill incomplet — relancer sans --verify"
    );
    return;
  }

  const res = await pool.query(`
    INSERT INTO event_rsvps (event_id, user_id)
    ${SOURCE}
    ON CONFLICT (event_id, user_id) DO NOTHING
  `);

  console.log(`inscriptions migrées      : ${res.rowCount}`);
  console.log(`déjà présentes (ignorées) : ${attendu.rows[0].n - res.rowCount}`);
  console.log(`références mortes ignorées : ${orphelins.rows[0].n}`);
  console.log("La colonne rsvp_user_ids est conservée (retour arrière possible).");
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("ÉCHEC :", err.message);
    await pool.end();
    process.exit(1);
  });
