/**
 * Developer-workspace data access. Every write below is sent with the signed-in developer's session and is
 * accepted or rejected by Postgres (RLS + public.is_developer()). Nothing in this file grants any power by itself.
 */
import { getResourceUrl } from "./api";
import { supabase } from "./supabase";
import type { ResourceType, VerificationStatus } from "../types";

/** Developers get specific messages (they can act on them); students never reach this code. */
export function devMessage(e: unknown): string {
  const err = e as { code?: string; message?: string; details?: string } | null;
  switch (err?.code) {
    case "23505": return "That already exists (duplicate code or record).";
    case "23503": return "Can't do that: other records (subjects or resources) still depend on it.";
    case "23514": return "A validation rule rejected that value (for example a question paper needs a year).";
    case "42501": return "Not permitted. Sign in with a developer account.";
    case "23502": return "A required field is missing.";
  }
  if (e instanceof Error && e.message) return e.message;
  return err?.message ?? "Something went wrong.";
}

async function must<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(devMessage(error));
  return data as T;
}

// ---------------- shapes ----------------
export interface DevProgramme { id: string; code: string; name: string; degree: string; sort_order: number | null; is_active: boolean }
export interface DevScheme { id: string; code: string; name: string; source_url: string | null; verification_status: VerificationStatus }
export interface DevSemester { id: string; semester_number: number; name: string }
export interface DevSubject {
  id: string; code: string; name: string; course_type: string | null; course_category: string | null;
  credits: number | null; course_slot: string | null; source_url: string | null;
  verification_status: VerificationStatus; course_id: string | null;
}
export interface DevResource {
  id: string; title: string; resource_type: ResourceType; academic_year: number | null; exam_session: string | null;
  exam_type: string | null; status: "draft" | "published" | "archived"; file_name: string | null;
  file_size_bytes: number | null; created_at: string; subject: { code: string; name: string } | null;
}

// ---------------- programmes ----------------
export const listProgrammes = () =>
  must<DevProgramme[]>(supabase.from("programmes").select("id, code, name, degree, sort_order, is_active").order("sort_order", { nullsFirst: false }).order("code"));

export async function saveProgramme(p: { id?: string; code: string; name: string; degree: string; sort_order: number | null; is_active: boolean }) {
  const row = { code: p.code.trim().toUpperCase(), name: p.name.trim(), degree: p.degree.trim() || "B.Tech", short_name: p.code.trim().toUpperCase(), sort_order: p.sort_order, is_active: p.is_active };
  if (p.id) await must(supabase.from("programmes").update(row).eq("id", p.id));
  else await must(supabase.from("programmes").insert(row));
}
export const deleteProgramme = (id: string) => must(supabase.from("programmes").delete().eq("id", id));

// ---------------- schemes ----------------
export const listSchemes = (programmeId: string) =>
  must<DevScheme[]>(supabase.from("schemes").select("id, code, name, source_url, verification_status").eq("programme_id", programmeId).order("code", { ascending: false }));

export async function saveScheme(programmeId: string, s: { id?: string; code: string; name: string; source_url: string; verification_status: VerificationStatus }) {
  const row = { code: s.code.trim(), name: s.name.trim() || `${s.code.trim()} Scheme`, source_url: s.source_url.trim() || null, verification_status: s.verification_status };
  if (s.id) await must(supabase.from("schemes").update(row).eq("id", s.id));
  else await must(supabase.from("schemes").insert({ ...row, programme_id: programmeId }));
}
export const deleteScheme = (id: string) => must(supabase.from("schemes").delete().eq("id", id));

// ---------------- semesters ----------------
export const listSemesters = (schemeId: string) =>
  must<DevSemester[]>(supabase.from("semesters").select("id, semester_number, name").eq("scheme_id", schemeId).order("semester_number"));

/** Creates only the semester numbers that don't exist yet (the unique constraint prevents duplicates regardless). */
export async function createSemesters(schemeId: string, numbers: number[]) {
  if (!numbers.length) return;
  await must(supabase.from("semesters").insert(numbers.map((n) => ({ scheme_id: schemeId, semester_number: n, name: `Semester ${n}` }))));
}
export const deleteSemester = (id: string) => must(supabase.from("semesters").delete().eq("id", id));

// ---------------- subjects ----------------
export const listSubjects = (semesterId: string) =>
  must<DevSubject[]>(supabase.from("subjects").select("id, code, name, course_type, course_category, credits, course_slot, source_url, verification_status, course_id").eq("semester_id", semesterId).order("sort_order", { nullsFirst: false }).order("code"));

export interface SubjectForm {
  id?: string; code: string; name: string; course_type: string; course_category: string; credits: string;
  course_slot: string; source_url: string; verification_status: VerificationStatus;
}

export async function saveSubject(semesterId: string, f: SubjectForm) {
  const code = f.code.trim().toUpperCase();
  const name = f.name.trim();
  const credits = f.credits.trim() === "" ? null : Number(f.credits);
  if (credits !== null && (!Number.isFinite(credits) || credits < 0 || credits > 20)) throw new Error("Credits must be a number between 0 and 20, or empty.");
  const detail = {
    name, course_type: f.course_type || null, course_category: f.course_category.trim().toUpperCase() || null,
    credits, source_url: f.source_url.trim() || null, verification_status: f.verification_status,
  };

  if (f.id) {
    const { course_id } = await must<{ course_id: string | null }>(supabase.from("subjects").update({ ...detail, course_slot: f.course_slot.trim() || null }).eq("id", f.id).select("course_id").single());
    if (course_id) await must(supabase.from("courses").update(detail).eq("id", course_id));
    return;
  }

  // new subject: reuse the canonical course row for this code, or create it
  const existing = await must<{ id: string; name: string }[]>(supabase.from("courses").select("id, name").eq("code", code));
  let courseId = existing[0]?.id ?? null;
  if (existing[0] && existing[0].name.trim().toLowerCase() !== name.toLowerCase()) {
    throw new Error(`Code ${code} already exists as “${existing[0].name}”. Use that exact name, or a different code.`);
  }
  if (!courseId) {
    const created = await must<{ id: string }>(supabase.from("courses").insert({ code, ...detail }).select("id").single());
    courseId = created.id;
  }
  await must(supabase.from("subjects").insert({ semester_id: semesterId, course_id: courseId, code, course_slot: f.course_slot.trim() || null, ...detail }));
}
export const deleteSubject = (id: string) => must(supabase.from("subjects").delete().eq("id", id));

// ---------------- checks (what needs attention) ----------------
export interface GapSubject {
  id: string; code: string; name: string; verification_status: VerificationStatus;
  semester: { id: string; semester_number: number; scheme: { id: string; code: string; programme: { id: string; code: string } } };
}
export interface GapResource { id: string; title: string; subject_id: string | null; resource_type: ResourceType; academic_year: number | null; status: "draft" | "published" | "archived" }

/** Everything the Checks tab needs, in two light queries. Rows only; no counters are shown anywhere. */
export async function listCatalogueGaps() {
  const [subjects, resources] = await Promise.all([
    must<GapSubject[]>(supabase.from("subjects").select("id, code, name, verification_status, semester:semesters(id, semester_number, scheme:schemes(id, code, programme:programmes(id, code)))").order("code").range(0, 999).returns<GapSubject[]>()),
    must<GapResource[]>(supabase.from("resources").select("id, title, subject_id, resource_type, academic_year, status").order("created_at", { ascending: false }).range(0, 999).returns<GapResource[]>()),
  ]);
  return { subjects, resources };
}

export type FileCheck = "ok" | "missing" | "unverifiable";

/**
 * Best-effort availability check for a published PDF: asks for a signed URL, then requests the first byte.
 * The signing function does not look inside storage, so a browser-side request is the only check available here;
 * if storage doesn't allow cross-origin reads the answer is "unverifiable" rather than a guess.
 */
export async function checkResourceFile(id: string): Promise<FileCheck> {
  const { url } = await getResourceUrl(id, "inline");
  try {
    const res = await fetch(url, { headers: { Range: "bytes=0-0" } });
    if (res.status === 404 || res.status === 410) return "missing";
    return res.ok ? "ok" : "unverifiable";
  } catch { return "unverifiable"; }
}

// ---------------- resources ----------------
export const listResources = () =>
  must<DevResource[]>(supabase.from("resources").select("id, title, resource_type, academic_year, exam_session, exam_type, status, file_name, file_size_bytes, created_at, subject:subjects(code, name)").order("created_at", { ascending: false }).limit(200).returns<DevResource[]>());

export const setResourceStatus = (id: string, status: DevResource["status"]) =>
  must(supabase.from("resources").update({ status, published_at: status === "published" ? new Date().toISOString() : null }).eq("id", id));

/** Result envelope of the developer-resources Edge Function. */
export interface UploadResult { ok: boolean; duplicate?: boolean; id?: string; message?: string }

async function callFunction(body: FormData | Record<string, unknown>): Promise<UploadResult> {
  const { data, error } = await supabase.functions.invoke<UploadResult & { error?: string }>("developer-resources", { body });
  if (error) {
    let detail = "";
    try { detail = ((await (error as { context?: Response }).context?.json()) as { message?: string })?.message ?? ""; } catch { /* not JSON */ }
    throw new Error(detail || "The upload service didn't accept that. Check you are signed in as a developer and the function is deployed.");
  }
  return data ?? { ok: false, message: "No response from the upload service." };
}

export const uploadResource = (form: FormData) => callFunction(form);
export const deleteResource = (id: string) => callFunction({ action: "delete", id });
