import type { ExamType, ResourceType } from "../types";

export const RESOURCE_TYPES: { value: ResourceType; label: string; plural: string; hint: string }[] = [
  { value: "pyq", label: "Question paper", plural: "Question papers", hint: "Previous year papers" },
  { value: "notes", label: "Notes", plural: "Notes", hint: "Class & module notes" },
  { value: "study_material", label: "Study material", plural: "Study materials", hint: "Textbooks & guides" },
  { value: "lab", label: "Lab resource", plural: "Lab resources", hint: "Manuals & experiments" },
  { value: "other", label: "Other", plural: "Other", hint: "Everything else" },
];

export const resourceTypeLabel = (t: ResourceType | string): string =>
  RESOURCE_TYPES.find((r) => r.value === t)?.label ?? "Resource";

export const resourceTypePlural = (t: ResourceType | string): string =>
  RESOURCE_TYPES.find((r) => r.value === t)?.plural ?? "Resources";

export const isResourceType = (v: string | null): v is ResourceType => RESOURCE_TYPES.some((r) => r.value === v);

const EXAM_TYPES: Record<ExamType, string> = {
  end_semester: "End semester",
  supplementary: "Supplementary",
  series_test: "Series test",
  model: "Model exam",
  other: "Other exam",
};
export const EXAM_TYPE_OPTIONS = (Object.entries(EXAM_TYPES) as [ExamType, string][]).map(([value, label]) => ({ value, label }));
export const examTypeLabel = (t: ExamType | null) => (t ? EXAM_TYPES[t] ?? null : null);

const COURSE_TYPES: Record<string, string> = {
  theory: "Theory", lab: "Lab", workshop: "Workshop", project: "Project",
  seminar: "Seminar", elective: "Elective", other: "Other",
};
export function courseTypeLabel(t: string | null): string | null {
  if (!t) return null;
  const key = t.trim().toLowerCase();
  return COURSE_TYPES[key] ?? t.trim().charAt(0).toUpperCase() + t.trim().slice(1);
}

export const formatCredits = (c: number | null): string | null =>
  c === null || c === undefined ? null : `${Number(c)} ${Number(c) === 1 ? "credit" : "credits"}`;

export const semesterLabel = (n: number | null | undefined) => (n ? `S${n}` : "—");
export const padSemester = (n: number) => String(n).padStart(2, "0");

export function formatBytes(n: number | null): string | null {
  if (!n && n !== 0) return null;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Year is a question-paper field. */
export const isQuestionPaper = (t: ResourceType | string | null | undefined): boolean => t === "pyq";

/** "2023 · December · End semester" — question papers only; every other category has no exam details. */
export function examSummary(r: { resource_type: ResourceType; academic_year: number | null; exam_session: string | null; exam_type: ExamType | null }): string | null {
  if (r.resource_type !== "pyq") return null;
  const parts = [r.academic_year, r.exam_session, examTypeLabel(r.exam_type)].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
