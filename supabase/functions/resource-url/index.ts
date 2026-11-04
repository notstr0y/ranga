// Supabase Edge Function: resource-url
// Turns a published resource ID into a short-lived signed GET URL for the private BookMyHost bucket (PDFs only).
//
//  * The client sends ONLY a resource id (never an object key).
//  * The key is read from the database, and only if the resource exists and is published.
//  * S3 and service-role secrets live in Edge Function secrets — never in the browser.
import { createClient } from "npm:@supabase/supabase-js@2";
import { GetObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3";
import { getSignedUrl } from "npm:@aws-sdk/s3-request-presigner@3";

const EXPIRES_SECONDS = 300;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const allowed = (Deno.env.get("ALLOWED_ORIGINS") ?? "*").split(",").map((s) => s.trim());
function cors(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  const ok = allowed.includes("*") || allowed.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? (allowed.includes("*") ? "*" : origin) : allowed[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

const s3 = new S3Client({
  endpoint: Deno.env.get("S3_ENDPOINT")!,
  region: Deno.env.get("S3_REGION") ?? "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: Deno.env.get("S3_ACCESS_KEY_ID")!,
    secretAccessKey: Deno.env.get("S3_SECRET_ACCESS_KEY")!,
  },
});
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method_not_allowed" }, 405);

  let body: { id?: unknown; disposition?: unknown };
  try { body = await req.json(); } catch { return json(req, { error: "invalid_body" }, 400); }

  const id = typeof body.id === "string" ? body.id : "";
  if (!UUID.test(id)) return json(req, { error: "invalid_id" }, 400);
  const disposition = body.disposition === "attachment" ? "attachment" : "inline";

  const { data, error } = await db
    .from("resources")
    .select("id, file_key, file_name, mime_type")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) { console.error("db error", error.message); return json(req, { error: "lookup_failed" }, 500); }
  if (!data) return json(req, { error: "not_found" }, 404);
  if (!data.file_key) return json(req, { error: "not_found" }, 404);

  const safeName = (data.file_name ?? "resource.pdf").replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  try {
    const url = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: Deno.env.get("S3_BUCKET")!,
        Key: data.file_key,
        ResponseContentType: data.mime_type ?? "application/pdf",
        ResponseContentDisposition: `${disposition}; filename="${safeName}"`,
      }),
      { expiresIn: EXPIRES_SECONDS },
    );
    return json(req, { kind: "file", url, expiresIn: EXPIRES_SECONDS, fileName: safeName });
  } catch (e) {
    console.error("sign error", e instanceof Error ? e.message : e);
    return json(req, { error: "sign_failed" }, 500);
  }
});
