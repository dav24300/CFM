#!/usr/bin/env node
/**
 * Crée le bucket public media-uploads sur Supabase Storage.
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/setup-supabase-bucket.mjs
 */
const url = process.env.SUPABASE_URL || "https://mzzgzcksavtuegamyudg.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = process.env.SUPABASE_STORAGE_BUCKET || "media-uploads";

if (!key) {
  console.error("SUPABASE_SERVICE_ROLE_KEY requis");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${key}`,
  apikey: key,
  "Content-Type": "application/json",
};

async function main() {
  const listRes = await fetch(`${url}/storage/v1/bucket`, { headers });
  if (!listRes.ok) {
    throw new Error(`Liste buckets échouée (${listRes.status}): ${await listRes.text()}`);
  }
  const buckets = await listRes.json();
  const exists = buckets.some((b) => b.name === bucket || b.id === bucket);
  if (exists) {
    console.log(`✓ Bucket « ${bucket} » existe déjà`);
    return;
  }

  const createRes = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: bucket, public: true }),
  });
  if (!createRes.ok) {
    throw new Error(`Création bucket échouée (${createRes.status}): ${await createRes.text()}`);
  }
  console.log(`✓ Bucket public « ${bucket} » créé`);
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
