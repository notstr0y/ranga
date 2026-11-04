// Shared helpers for admin scripts. These run on YOUR machine only — never bundled into the app.
import { S3Client } from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

export function requireEnv(names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) {
    console.error(`Missing environment variables: ${missing.join(", ")}`);
    console.error("Create .env.local (see .env.example). Run scripts through npm so it is loaded.");
    process.exit(1);
  }
}

export function adminClients() {
  requireEnv([
    "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
    "S3_ENDPOINT", "S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY",
  ]);
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  return { db, s3, bucket: process.env.S3_BUCKET };
}

export function fail(msg, detail) {
  console.error(`\n✗ ${msg}`);
  if (detail) console.error(`  ${detail}`);
  process.exit(1);
}
