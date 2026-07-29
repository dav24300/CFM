#!/usr/bin/env node
/**
 * Normalisation des numéros de téléphone : users.phone (brut) → users.phone_e164,
 * puis pose de l'index UNIQUE partiel qui fait du numéro un identifiant de
 * connexion.
 *
 * Volontairement HORS de scripts/schema.sql, rejoué à chaque démarrage : un
 * backfill se joue explicitement, une fois. Surtout, un CREATE UNIQUE INDEX
 * dépend des données — des doublons de numéro existent (comptes QA de test,
 * foyers) — et un tel index dans schema.sql, envoyé en une transaction
 * implicite unique, annulerait TOUT le schéma à chaque requête HTTP en cas de
 * conflit. Il n'a donc rien à faire là.
 *
 * Idempotent et RÉVERSIBLE : la colonne `phone` brute n'est jamais modifiée.
 *
 * Politique FAIL-CLOSED : un numéro normalisé porté par PLUSIEURS comptes n'est
 * attribué à AUCUN d'eux (phone_e164 reste NULL pour tout le groupe). Aucune
 * heuristique ne décide « qui hérite du numéro » — c'est une décision humaine.
 * L'index UNIQUE partiel ne peut donc jamais entrer en conflit.
 *
 * Le script pose LUI-MÊME son DDL (email nullable + colonne + index de lookup)
 * avant tout : le résultat est identique que bootstrap:pg ait été rejoué ou
 * non, et que CFM_SKIP_RUNTIME_SCHEMA soit posé ou non (comparaison stricte à
 * "true" côté application — on n'en dépend pas ici).
 *
 * Usage :
 *   DATABASE_URL=... npm run backfill:phones -- --verify   (lecture seule, rapport)
 *   DATABASE_URL=... npm run backfill:phones               (normalise + index unique)
 */
import pg from "pg";
import { normalizePhoneRdc } from "../src/domain/phone.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL requis");
  process.exit(1);
}

const verifyOnly = process.argv.includes("--verify");
const pool = new pg.Pool({ connectionString: databaseUrl });

/** DDL auto-suffisant : idempotent, incapable d'échouer sur les données. */
async function ensureColumns() {
  await pool.query("ALTER TABLE users ALTER COLUMN email DROP NOT NULL");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_e164 VARCHAR(20)");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ");
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_users_phone_e164 ON users(phone_e164) WHERE phone_e164 IS NOT NULL"
  );
  // '' n'est pas NULL : il violerait users_email_key au 2e compte sans email.
  await pool.query("UPDATE users SET email = NULL WHERE email IS NOT NULL AND btrim(email) = ''");
}

/**
 * Calcule, pour tous les comptes ayant un `phone`, la forme E.164 attendue, et
 * répartit en trois catégories :
 *  - assignables : numéro normalisable ET porté par un seul compte ;
 *  - collisions  : numéro normalisable porté par plusieurs comptes (fail-closed) ;
 *  - illisibles  : `phone` présent mais non normalisable.
 */
function classify(rows) {
  const byE164 = new Map(); // e164 → [ids]
  const illisibles = [];
  for (const r of rows) {
    const e164 = normalizePhoneRdc(r.phone);
    if (!e164) {
      illisibles.push(r);
      continue;
    }
    const bucket = byE164.get(e164) ?? [];
    bucket.push(r);
    byE164.set(e164, bucket);
  }
  const assignables = [];
  const collisions = [];
  for (const [e164, group] of byE164) {
    if (group.length === 1) assignables.push({ id: group[0].id, e164 });
    else collisions.push({ e164, ids: group.map((g) => g.id).sort((a, b) => a - b) });
  }
  return { assignables, collisions, illisibles };
}

function printReports({ collisions, illisibles }) {
  if (illisibles.length) {
    console.warn(`\n⚠ ${illisibles.length} numéro(s) non normalisable(s) — ces membres ne pourront pas se connecter par téléphone. À corriger à la main :`);
    for (const r of illisibles) {
      console.warn(`   id=${r.id}  ${r.first_name ?? ""} ${r.last_name ?? ""}  phone=${JSON.stringify(r.phone)}  email=${r.email ?? "—"}`);
    }
  }
  if (collisions.length) {
    console.warn(`\n⚠ ${collisions.length} numéro(s) partagé(s) par plusieurs comptes — FAIL-CLOSED : phone_e164 laissé NULL pour tout le groupe (aucune connexion par téléphone tant qu'un humain n'a pas tranché) :`);
    for (const c of collisions) {
      console.warn(`   ${c.e164}  →  ids ${c.ids.join(", ")}`);
    }
  }
}

async function runVerify() {
  const { rows } = await pool.query(
    "SELECT id, first_name, last_name, phone, email, phone_e164 FROM users WHERE phone IS NOT NULL AND btrim(phone) <> ''"
  );
  const { assignables, collisions, illisibles } = classify(rows);

  // Dérive attendue par ligne, comparée au stocké : seul garde-fou contre la
  // divergence entre la colonne et la fonction de normalisation.
  const assignableIds = new Map(assignables.map((a) => [a.id, a.e164]));
  let mismatches = 0;
  for (const r of rows) {
    const attendu = assignableIds.get(r.id) ?? null; // NULL attendu pour collisions/illisibles
    if ((r.phone_e164 ?? null) !== attendu) {
      mismatches++;
      if (mismatches <= 20) {
        console.warn(`   divergence id=${r.id} : stocké=${r.phone_e164 ?? "NULL"} attendu=${attendu ?? "NULL"}`);
      }
    }
  }

  console.log(`\ncomptes avec un phone           : ${rows.length}`);
  console.log(`assignables (numéro unique)     : ${assignables.length}`);
  console.log(`en collision (laissés NULL)     : ${collisions.length} groupe(s)`);
  console.log(`illisibles (laissés NULL)       : ${illisibles.length}`);
  console.log(`divergences colonne/fonction    : ${mismatches}`);
  printReports({ collisions, illisibles });

  const { rows: idx } = await pool.query(
    "SELECT to_regclass('public.idx_users_phone_e164_unique') IS NOT NULL AS ok"
  );
  console.log(`index UNIQUE partiel posé       : ${idx[0].ok ? "oui" : "non"}`);
  console.log(mismatches === 0 ? "\n✓ colonne cohérente avec la normalisation" : "\n✗ divergences détectées — relancer sans --verify");
}

async function runBackfill() {
  await ensureColumns();

  const { rows } = await pool.query(
    "SELECT id, first_name, last_name, phone, email, phone_e164 FROM users WHERE phone IS NOT NULL AND btrim(phone) <> ''"
  );
  const { assignables, collisions, illisibles } = classify(rows);

  // Écriture idempotente : seuls les numéros à compte unique reçoivent leur
  // e164 ; les collisions et illisibles sont explicitement remis à NULL (au cas
  // où un run antérieur ou l'application aurait posé une valeur en conflit).
  const assignableIds = new Set(assignables.map((a) => a.id));
  const ids = assignables.map((a) => a.id);
  const e164s = assignables.map((a) => a.e164);

  await pool.query("BEGIN");
  try {
    // 1. NULL pour tout ce qui n'est pas assignable (collisions, illisibles).
    const nonAssignable = rows.map((r) => r.id).filter((id) => !assignableIds.has(id));
    if (nonAssignable.length) {
      await pool.query(
        "UPDATE users SET phone_e164 = NULL WHERE id = ANY($1::int[]) AND phone_e164 IS NOT NULL",
        [nonAssignable]
      );
    }
    // 2. e164 pour les numéros à compte unique.
    if (ids.length) {
      await pool.query(
        `UPDATE users AS u SET phone_e164 = v.e164
         FROM (SELECT * FROM unnest($1::int[], $2::text[]) AS t(id, e164)) AS v
         WHERE u.id = v.id AND u.phone_e164 IS DISTINCT FROM v.e164`,
        [ids, e164s]
      );
    }
    // 3. Index UNIQUE partiel : sûr car les collisions restent NULL (exclues du
    //    partiel). C'est lui qui fait du numéro un identifiant de connexion.
    await pool.query(
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone_e164_unique ON users(phone_e164) WHERE phone_e164 IS NOT NULL"
    );
    await pool.query("COMMIT");
  } catch (err) {
    await pool.query("ROLLBACK");
    throw err;
  }

  console.log(`\nnuméros normalisés (uniques)    : ${assignables.length}`);
  console.log(`en collision (laissés NULL)     : ${collisions.length} groupe(s)`);
  console.log(`illisibles (laissés NULL)       : ${illisibles.length}`);
  console.log("index UNIQUE partiel idx_users_phone_e164_unique posé.");
  console.log("La colonne `phone` brute est conservée (retour arrière possible).");
  printReports({ collisions, illisibles });

  // Une collision ou un illisible n'est PAS une erreur d'exécution (le résultat
  // est valide et l'index est posé), mais doit sortir en échec pour forcer la
  // relecture du rapport avant le go-live : ce sont des comptes injoignables
  // par téléphone. exit(2) = « terminé, mais des comptes exigent une décision ».
  if (collisions.length || illisibles.length) {
    console.warn("\n→ Des comptes restent sans connexion par téléphone (voir ci-dessus). Résoudre AVANT la campagne de saisie.");
    process.exitCode = 2;
  }
}

(verifyOnly ? runVerify() : runBackfill())
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("ÉCHEC :", err.message);
    await pool.end();
    process.exit(1);
  });
