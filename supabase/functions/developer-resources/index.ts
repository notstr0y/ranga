// Supabase Edge Function: developer-resources
// The ONLY way a PDF enters RANGA. Used by the developer workspace.
//
//   POST multipart/form-data  -> upload (subject_id, resource_type, title, [description], [academic_year, exam_session,
//                                 exam_type — question papers only], file)
//   POST application/json     -> { "action": "delete", "id": "<resource uuid>" }
//
// Security model
//  * The caller must send a valid Supabase user JWT. The user id is taken from the verified token, then looked up in
//    public.app_developers with the service role. Anyone else gets 403 — nothing is parsed or stored.
//  * The bucket stays private. S3 and service-role secrets exist only in Edge Function secrets.
//  * The file's real content is checked (%PDF- signature, <= 25 MB); the client's MIME type / name are ignored.
//  * The object key is generated server-side from the subject id + a random UUID.
//  * The database row is inserted AFTER the object is stored; if the insert fails the object is deleted again.
//  * Retrying the same file is safe: a SHA-256 unique index makes it return the existing record instead of a duplicate.
import { createClient } from "npm:@supabase/supabase-js@2";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "npm:@aws-sdk/client-s3@3";
import { MAX_PDF_BYTES, buildObjectKey, hasPdfSignature, isUuid, safeFileName, validateFields } from "./validate.ts";

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
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json", "Cache-Control": "no-store" } });
const refuse = (req: Request, message: string, status = 400) => json(req, { ok: false, message }, status);

const bucket = Deno.env.get("S3_BUCKET")!;
const s3 = new S3Client({
  endpoint: Deno.env.get("S3_ENDPOINT")!,
  region: Deno.env.get("S3_REGION") ?? "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: Deno.env.get("S3_ACCESS_KEY_ID")!, secretAccessKey: Deno.env.get("S3_SECRET_ACCESS_KEY")! },
});
const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: { persistSession: false, autoRefreshToken: false },
  },
);

async function requireDeveloper(req: Request): Promise<string | null> {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const { data: u, error: authError } = await db.auth.getUser(token);

  if (authError || !u.user) {
    console.error("Developer auth failed:", authError?.message);
    return null;
  }

  const { data, error: developerError } = await db
    .from("app_developers")
    .select("user_id")
    .eq("user_id", u.user.id)
    .maybeSingle();

  if (developerError) {
    console.error("Developer lookup failed:", developerError.message);
    return null;
  }

  return data ? u.user.id : null;
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function deleteObject(key: string) {
  try { await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })); }
  catch (e) { console.error("object cleanup failed", key, e instanceof Error ? e.message : e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return refuse(req, "Method not allowed.", 405);

  const userId = await requireDeveloper(req);
  if (!userId) return refuse(req, "Developer access required.", 403);

  const contentType = req.headers.get("content-type") ?? "";

  // ---------------- delete ----------------
  if (contentType.includes("application/json")) {
    let body: { action?: unknown; id?: unknown };
    try { body = await req.json(); } catch { return refuse(req, "Invalid request."); }
    if (body.action !== "delete" || !isUuid(body.id)) return refuse(req, "Invalid request.");
    const { data: row } = await db.from("resources").select("id, file_key").eq("id", body.id).maybeSingle();
    if (!row) return refuse(req, "Resource not found.", 404);
    const { error } = await db.from("resources").delete().eq("id", row.id);
    if (error) { console.error("delete failed", error.message); return refuse(req, "Couldn't delete the record.", 500); }
    if (row.file_key && String(row.file_key).startsWith("resources/")) await deleteObject(row.file_key);
    return json(req, { ok: true });
  }

  // ---------------- upload ----------------
  if (!contentType.includes("multipart/form-data")) return refuse(req, "Invalid request.");
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_PDF_BYTES + 512 * 1024) return refuse(req, "That file is too large (25 MB maximum).", 413);

  let form: FormData;
  try { form = await req.formData(); } catch { return refuse(req, "Couldn't read the upload."); }

  const fields = validateFields((k) => form.get(k));
  if (!fields.ok) return refuse(req, fields.message);
  const f = fields.value;

  const file = form.get("file");
  if (!(file instanceof File)) return refuse(req, "Choose a PDF file.");
  if (file.size > MAX_PDF_BYTES) return refuse(req, "That file is too large (25 MB maximum).", 413);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasPdfSignature(bytes)) return refuse(req, "That file isn't a valid PDF.");

  // the subject must exist
  const { data: subject, error: subjectError } = await db
  .from("subjects")
  .select("id")
  .eq("id", f.subjectId)
  .maybeSingle();

if (subjectError) {
  console.error("Subject lookup failed:", subjectError.message);
  return refuse(req, "Couldn't verify the selected subject.", 500);
}

if (!subject) {
  console.error("Subject not found:", f.subjectId);
  return refuse(req, "That subject no longer exists. Refresh the page and select it again.", 404);
}

  // retry / duplicate protection
  const hash = await sha256Hex(bytes);
  const { data: dup } = await db.from("resources").select("id").eq("sha256", hash).maybeSingle();
  if (dup) return json(req, { ok: true, duplicate: true, id: dup.id });

  const key = buildObjectKey(f.subjectId, crypto.randomUUID());
  try {
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: bytes, ContentType: "application/pdf", ContentLength: bytes.length }));
  } catch (e) {
    console.error("storage put failed", e instanceof Error ? e.message : e);
    return refuse(req, "Couldn't store the file. Nothing was saved — try again.", 502);
  }

  const { data: inserted, error } = await db.from("resources").insert({
    subject_id: f.subjectId, title: f.title, description: f.description, resource_type: f.type,
    academic_year: f.year, exam_session: f.session, exam_type: f.examType,
    file_key: key, file_name: safeFileName(f.title), file_size_bytes: bytes.length, mime_type: "application/pdf", sha256: hash,
    status: "published", published_at: new Date().toISOString(),
  }).select("id").single();

  if (error) {
    await deleteObject(key); // roll the stored object back
    if (error.code === "23505") { // lost a race with an identical upload
      const { data: again } = await db.from("resources").select("id").eq("sha256", hash).maybeSingle();
      if (again) return json(req, { ok: true, duplicate: true, id: again.id });
    }
    console.error("insert failed", error.code, error.message);
    return refuse(req, "Couldn't save the record. The file was not kept — try again.", 500);
  }
  return json(req, { ok: true, id: inserted.id });
});
