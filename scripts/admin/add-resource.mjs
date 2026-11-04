// Add a resource (PDF upload) to RANGA from your own machine (service role; the developer workspace is the normal way).
//
//   npm run resource:add -- ./paper.pdf --programme CSE --scheme 2019 --semester 3 \
//        --subject CST201 --type pyq --title "Data Structures — Dec 2023" \
//        --year 2023 --session December --exam-type end_semester --publish
//
//
// Resources are saved as DRAFT unless --publish is given. Use --dry-run to validate only.
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { adminClients, fail } from "./_env.mjs";

const TYPES = ["pyq", "notes", "study_material", "lab", "other"];
const EXAM_TYPES = ["end_semester", "supplementary", "series_test", "model", "other"];
const MAX_BYTES = 25 * 1024 * 1024;

const { values: o, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    programme: { type: "string" }, scheme: { type: "string" }, semester: { type: "string" },
    subject: { type: "string" }, type: { type: "string" }, title: { type: "string" },
    description: { type: "string" }, year: { type: "string" }, session: { type: "string" },
    "exam-type": { type: "string" },
    publish: { type: "boolean", default: false }, "dry-run": { type: "boolean", default: false },
  },
});

const filePath = positionals[0];
if (!filePath) fail("Provide a PDF path.");
for (const k of ["programme", "scheme", "semester", "subject", "type", "title"])
  if (!o[k]) fail(`Missing required option --${k}`);
if (!TYPES.includes(o.type)) fail(`--type must be one of: ${TYPES.join(", ")}`);
if (o["exam-type"] && !EXAM_TYPES.includes(o["exam-type"])) fail(`--exam-type must be one of: ${EXAM_TYPES.join(", ")}`);
const semester = Number(o.semester);
if (!Number.isInteger(semester) || semester < 1 || semester > 8) fail("--semester must be 1-8");
const isPaper = o.type === "pyq";
if (!isPaper && (o.year || o.session || o["exam-type"])) fail("--year, --session and --exam-type apply to question papers (--type pyq) only.");
const year = o.year ? Number(o.year) : null;
if (isPaper && !o.year) fail("Question papers need --year.");
if (o.year && (!Number.isInteger(year) || year < 2000 || year > 2100)) fail("--year must be a 4-digit year");

const { db, s3, bucket } = adminClients();

// ---- resolve programme -> scheme -> semester -> subject ----
const { data: prog } = await db.from("programmes").select("id, code").eq("code", o.programme).maybeSingle();
if (!prog) fail(`Programme '${o.programme}' not found.`, "Run 000_preflight_inspect.sql to list codes.");
const { data: sch } = await db.from("schemes").select("id").eq("programme_id", prog.id).eq("code", o.scheme).maybeSingle();
if (!sch) fail(`Scheme '${o.scheme}' not found for ${o.programme}.`);
const { data: sem } = await db.from("semesters").select("id").eq("scheme_id", sch.id).eq("semester_number", semester).maybeSingle();
if (!sem) fail(`Semester ${semester} not found for ${o.programme} ${o.scheme}.`);
const { data: subj } = await db.from("subjects").select("id, code, name").eq("semester_id", sem.id).eq("code", o.subject).maybeSingle();
if (!subj) fail(`Subject '${o.subject}' not found in ${o.programme} ${o.scheme} S${semester}.`, "Check the catalogue (subject codes are matched exactly).");

const status = o.publish ? "published" : "draft";
const base = {
  subject_id: subj.id, title: o.title.trim(), description: o.description?.trim() || null,
  resource_type: o.type, academic_year: year, exam_session: o.session?.trim() || null,
  exam_type: o["exam-type"] || null, status, published_at: o.publish ? new Date().toISOString() : null,
};

// ---------------- PDF upload ----------------
if (path.extname(filePath).toLowerCase() !== ".pdf") fail("Only .pdf files are supported for uploads.");
const info = await stat(filePath).catch(() => null);
if (!info?.isFile()) fail(`File not found: ${filePath}`);
if (info.size === 0) fail("The file is empty.");
if (info.size > MAX_BYTES) fail(`File is ${(info.size / 1048576).toFixed(1)} MB; the limit is 25 MB.`);
const buf = await readFile(filePath);
if (buf.subarray(0, 5).toString() !== "%PDF-") fail("This is not a valid PDF (missing %PDF- header).");

const sha256 = createHash("sha256").update(buf).digest("hex");
const { data: dup } = await db.from("resources").select("id, title").eq("sha256", sha256).maybeSingle();
if (dup) { console.log(`↺ This exact file is already uploaded as "${dup.title}" (id ${dup.id}). Nothing to do.`); process.exit(0); }

const slug = path.basename(filePath, path.extname(filePath)).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "file";
const key = ["resources", o.programme, o.scheme, `s${semester}`, o.subject, o.type, `${sha256.slice(0, 12)}-${slug}.pdf`]
  .map((s) => String(s).toLowerCase()).join("/");
const row = { ...base, file_key: key, file_name: path.basename(filePath), file_size_bytes: info.size, mime_type: "application/pdf", sha256 };

if (o["dry-run"]) { console.log("✓ Dry run OK — would upload and insert:", row); process.exit(0); }

try {
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: "application/pdf", ContentLength: info.size }));
} catch (e) { fail("Upload to storage failed.", `${e.name}: ${e.message}`); }

const { data, error } = await db.from("resources").insert(row).select("id").single();
if (error) {
  // don't leave an orphaned object behind
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key })).catch(() => {});
  fail("Saved the file but could not record it in Supabase; the upload was rolled back.", error.message);
}
console.log(`✓ Uploaded and saved as ${status}.\n  id:  ${data.id}\n  key: ${key}\n  size: ${(info.size / 1048576).toFixed(2)} MB`);
if (!o.publish) console.log(`  Publish it with: npm run resource:status -- ${data.id} published`);
