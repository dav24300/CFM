#!/usr/bin/env node
/**
 * Seed des comptes QA par rôle, via l'API (fonctionne en mode JSON et PG,
 * exerce les vrais flux register → activation admin → attribution de rôle).
 *
 * Usage : serveur démarré, puis
 *   ADMIN_PASSWORD=... [QA_PASSWORD=...] [CFM_BASE_URL=http://localhost:3000] \
 *     node scripts/seed-qa-accounts.mjs
 *
 * Comptes créés (mot de passe commun = QA_PASSWORD ou généré et affiché) :
 *   qa-famille@cfm-qa.test       famille   → activé (member)
 *   qa-benevole@cfm-qa.test      bénévole  → activé (volunteer)
 *   qa-coordinateur@cfm-qa.test  soutien   → activé + rôle coordinator
 *   qa-pending@cfm-qa.test       famille   → laissé pending (teste le refus 403)
 */
import crypto from "crypto";

const BASE = (process.env.CFM_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const QA_PASSWORD =
  process.env.QA_PASSWORD || `Qa!${crypto.randomBytes(9).toString("base64url")}`;

if (!ADMIN_PASSWORD) {
  console.error("ADMIN_PASSWORD requis (activation + rôles via l'API admin).");
  process.exit(1);
}

const ACCOUNTS = [
  {
    email: "qa-famille@cfm-qa.test",
    membership_type: "famille",
    first_name: "QA",
    last_name: "Famille",
    military_link: "conjoint",
    activate: true,
  },
  {
    email: "qa-benevole@cfm-qa.test",
    membership_type: "benevole",
    first_name: "QA",
    last_name: "Bénévole",
    skills: "QA / recette",
    activate: true,
  },
  {
    email: "qa-coordinateur@cfm-qa.test",
    membership_type: "soutien",
    first_name: "QA",
    last_name: "Coordinateur",
    activate: true,
    role: "coordinator",
  },
  {
    email: "qa-pending@cfm-qa.test",
    membership_type: "famille",
    first_name: "QA",
    last_name: "EnAttente",
    military_link: "enfant",
    activate: false,
  },
];

async function api(path, options = {}, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // réponse sans corps JSON
  }
  return { status: res.status, body, headers: res.headers };
}

async function main() {
  // 1. Inscriptions
  for (const acc of ACCOUNTS) {
    const { status, body } = await api("/api/member/register", {
      method: "POST",
      body: JSON.stringify({
        email: acc.email,
        password: QA_PASSWORD,
        first_name: acc.first_name,
        last_name: acc.last_name,
        phone: "+243900000001",
        province: "Kinshasa",
        membership_type: acc.membership_type,
        military_link: acc.military_link,
        skills: acc.skills,
      }),
    });
    if (status === 200) console.log(`✔ inscrit    ${acc.email}`);
    else if (status === 400 && /utilisé|inscrit/i.test(body?.error || ""))
      console.log(`= existe     ${acc.email}`);
    else {
      console.error(`✖ register ${acc.email} → ${status} ${body?.error || ""}`);
      process.exit(1);
    }
  }

  // 2. Session admin
  const login = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password: ADMIN_PASSWORD }),
  });
  const cookie = (login.headers.getSetCookie?.() || [])
    .map((c) => c.split(";")[0])
    .join("; ");
  if (login.status !== 200 || !cookie) {
    console.error(`✖ login admin → ${login.status} ${login.body?.error || ""}`);
    process.exit(1);
  }

  // 3. Activation + rôles
  const usersRes = await api("/api/admin/users", {}, cookie);
  const users = usersRes.body?.users || [];
  for (const acc of ACCOUNTS) {
    const user = users.find((u) => u.email === acc.email);
    if (!user) {
      console.error(`✖ introuvable côté admin : ${acc.email}`);
      process.exit(1);
    }
    if (acc.activate && user.status !== "active") {
      const r = await api(
        `/api/admin/users/${user.id}/activate`,
        { method: "PATCH", body: JSON.stringify({ action: "activate" }) },
        cookie
      );
      if (r.status !== 200) {
        console.error(`✖ activation ${acc.email} → ${r.status}`);
        process.exit(1);
      }
      console.log(`✔ activé     ${acc.email}`);
    }
    if (acc.role && user.role !== acc.role) {
      const r = await api(
        `/api/admin/users/${user.id}/role`,
        { method: "PATCH", body: JSON.stringify({ role: acc.role }) },
        cookie
      );
      if (r.status !== 200) {
        console.error(`✖ rôle ${acc.role} ${acc.email} → ${r.status}`);
        process.exit(1);
      }
      console.log(`✔ rôle       ${acc.email} → ${acc.role}`);
    }
  }

  console.log("\nComptes QA prêts. Mot de passe commun :", QA_PASSWORD);
  console.log("(qa-pending@cfm-qa.test doit être refusé à la connexion : 403 attendu)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
