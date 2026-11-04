// Pure validation for developer uploads (no Deno / network APIs, so it is unit-testable with plain Node).

export const RESOURCE_TYPES = ["pyq", "notes", "study_material", "lab", "other"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];
export const EXAM_TYPES = ["end_semester", "supplementary", "series_test", "model", "other"] as const;
export const MAX_PDF_BYTES = 25 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

/** A real PDF starts with "%PDF-". The browser-declared MIME type and file name are never trusted. */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  return bytes.length > 8 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

export interface CleanUpload {
  subjectId: string;
  type: ResourceType;
  title: string;
  description: string | null;
  year: number | null;
  session: string | null;
  examType: string | null;
}

const str = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Returns the cleaned fields or a human-readable error. Year is required for pyq and ALWAYS dropped otherwise. */
export function validateFields(get: (k: string) => unknown, now = new Date()): { ok: true; value: CleanUpload } | { ok: false; message: string } {
  const subjectId = str(get("subject_id"), 40);
  if (!isUuid(subjectId)) return { ok: false, message: "Choose a subject." };

  const type = str(get("resource_type"), 20) as ResourceType;
  if (!RESOURCE_TYPES.includes(type)) return { ok: false, message: "Choose one of the five resource categories." };

  const title = str(get("title"), 200);
  if (title.length < 3) return { ok: false, message: "Title must be at least 3 characters." };

  let year: number | null = null;
  let session: string | null = null;
  let examType: string | null = null;
  if (type === "pyq") {
    year = Number(str(get("academic_year"), 4));
    if (!Number.isInteger(year) || year < 2000 || year > now.getUTCFullYear() + 1) return { ok: false, message: "Question papers need a valid year." };
    session = str(get("exam_session"), 40) || null;
    examType = str(get("exam_type"), 20) || null;
    if (examType && !(EXAM_TYPES as readonly string[]).includes(examType)) return { ok: false, message: "Unknown exam type." };
  }
  return { ok: true, value: { subjectId, type, title, description: str(get("description"), 1000) || null, year, session, examType } };
}

/** Object keys are generated here from validated ids only — never from the client's file name. */
export function buildObjectKey(subjectId: string, uuid: string): string {
  if (!isUuid(subjectId) || !isUuid(uuid)) throw new Error("bad key parts");
  return `resources/${subjectId}/${uuid}.pdf`;
}

/** Stored display name: a safe slug of the title (the original upload name is discarded). */
export function safeFileName(title: string): string {
  const slug = title.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim().replace(/\s+/g, "-").replace(/^\.+/, "").slice(0, 80) || "resource";
  return `${slug}.pdf`;
}
