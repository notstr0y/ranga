import { AppError, toAppError } from "./errors";
import { supabase, supabaseConfigured } from "./supabase";
import type {
  Page, Programme, Resource, ResourceType, Scheme, SearchFilters, Semester, Subject, SubjectDetail, SubjectHit,
} from "../types";

export const PAGE_SIZE = 20;

function guard() {
  if (!supabaseConfigured) throw new AppError("config", "RANGA isn't connected to its database yet.");
}

/** Run a Supabase call, throwing a safe AppError on failure. */
async function run<T>(call: () => PromiseLike<{ data: T | null; error: unknown; count?: number | null }>): Promise<{ data: T; count: number | null }> {
  guard();
  try {
    const { data, error, count } = await call();
    if (error) throw error;
    return { data: data as T, count: count ?? null };
  } catch (e) {
    throw toAppError(e);
  }
}

// ---------------- academic catalogue ----------------
let programmeCache: Programme[] | null = null;

export async function getProgrammes(): Promise<Programme[]> {
  if (programmeCache) return programmeCache;
  const { data } = await run<Programme[]>(() =>
    supabase.from("programmes").select("id, code, name, degree").order("sort_order", { nullsFirst: false }).order("name"),
  );
  programmeCache = data ?? [];
  return programmeCache;
}

export async function getSchemes(programmeId: string): Promise<Scheme[]> {
  const { data } = await run<Scheme[]>(() =>
    supabase.from("schemes").select("id, code, name, verification_status").eq("programme_id", programmeId).order("code", { ascending: false }),
  );
  return data ?? [];
}

/** Distinct scheme codes across all programmes — used by the search filter. */
export async function getSchemeCodes(): Promise<string[]> {
  const { data } = await run<{ code: string }[]>(() => supabase.from("schemes").select("code"));
  return [...new Set((data ?? []).map((s) => s.code))].sort().reverse();
}

export async function getSemesters(schemeId: string): Promise<Semester[]> {
  const { data } = await run<Semester[]>(() =>
    supabase.from("semesters").select("id, semester_number, name").eq("scheme_id", schemeId).order("semester_number"),
  );
  return data ?? [];
}

export async function getSemesterSubjects(semesterId: string): Promise<Subject[]> {
  const { data } = await run<Subject[]>(() => supabase.rpc("semester_subjects", { p_semester: semesterId }));
  return (data ?? []).map((s) => ({ ...s, resource_count: Number(s.resource_count) }));
}

export async function getSubject(id: string): Promise<SubjectDetail> {
  const { data } = await run<unknown>(() =>
    supabase
      .from("subjects")
      .select(
        "id, code, name, course_type, course_category, credits, course_slot, verification_status, " +
          "semester:semesters(id, semester_number, name, scheme:schemes(id, code, name, programme:programmes(id, code, name)))",
      )
      .eq("id", id)
      .maybeSingle(),
  );
  if (!data) throw new AppError("notfound", "We couldn't find that subject.");
  return data as SubjectDetail;
}

export async function getCatalogueStats(): Promise<{ programmes: number; subjects: number; resources: number }> {
  const [p, s, r] = await Promise.all([
    run(() => supabase.from("programmes").select("id", { count: "exact", head: true })),
    run(() => supabase.from("subjects").select("id", { count: "exact", head: true })),
    run(() => supabase.from("resource_catalogue").select("id", { count: "exact", head: true })),
  ]);
  return { programmes: p.count ?? 0, subjects: s.count ?? 0, resources: r.count ?? 0 };
}

// ---------------- resources ----------------
export async function getResource(id: string): Promise<Resource> {
  const { data } = await run<Resource>(() => supabase.from("resource_catalogue").select("*").eq("id", id).maybeSingle());
  if (!data) throw new AppError("notfound", "We couldn't find that resource. It may have been removed.");
  return data;
}

export async function getSubjectResources(subjectId: string): Promise<Resource[]> {
  const { data } = await run<Resource[]>(() =>
    supabase.from("resource_catalogue").select("*").eq("subject_id", subjectId).order("academic_year", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }),
  );
  return data ?? [];
}

export async function getRecentResources(limit = 6): Promise<Resource[]> {
  const { data } = await run<Resource[]>(() =>
    supabase.from("resource_catalogue").select("*").order("created_at", { ascending: false }).limit(limit),
  );
  return data ?? [];
}

export async function getTypeCounts(): Promise<Partial<Record<ResourceType, number>>> {
  const { data } = await run<{ resource_type: ResourceType; total: number }[]>(() => supabase.rpc("resource_type_counts"));
  const out: Partial<Record<ResourceType, number>> = {};
  for (const row of data ?? []) out[row.resource_type] = Number(row.total);
  return out;
}

export async function getResourceYears(): Promise<number[]> {
  const { data } = await run<{ academic_year: number }[]>(() => supabase.rpc("resource_years"));
  return (data ?? []).map((r) => r.academic_year);
}

// ---------------- search ----------------
export async function searchResources(f: SearchFilters, page: number): Promise<Page<Resource>> {
  const { data } = await run<(Resource & { total_count: number })[]>(() =>
    supabase.rpc("search_resources", {
      q: f.q?.trim() || null,
      p_programme: f.programme ?? null,
      p_scheme: f.scheme ?? null,
      p_semester: f.semester ?? null,
      p_type: f.type ?? null,
      p_year: f.year ?? null,
      p_limit: PAGE_SIZE,
      p_offset: page * PAGE_SIZE,
    }),
  );
  const rows = data ?? [];
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

export async function searchSubjects(f: SearchFilters, limit = 8): Promise<Page<SubjectHit>> {
  const { data } = await run<(SubjectHit & { total_count: number })[]>(() =>
    supabase.rpc("search_subjects", {
      q: f.q?.trim() || null,
      p_programme: f.programme ?? null,
      p_scheme: f.scheme ?? null,
      p_semester: f.semester ?? null,
      p_limit: limit,
      p_offset: 0,
    }),
  );
  const rows = (data ?? []).map((s) => ({ ...s, resource_count: Number(s.resource_count) }));
  return { rows, total: rows.length ? Number(data![0].total_count) : 0 };
}

// ---------------- signed download / preview URL ----------------
export interface ResourceUrl {
  kind: "file";
  url: string;
  fileName?: string;
}

export async function getResourceUrl(id: string, disposition: "inline" | "attachment"): Promise<ResourceUrl> {
  guard();
  try {
    const { data, error } = await supabase.functions.invoke<ResourceUrl & { error?: string }>("resource-url", {
      body: { id, disposition },
    });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      if (status === 404) throw new AppError("notfound", "This file isn't available right now.");
      throw error;
    }
    if (!data?.url) throw new AppError("server", "This file isn't available right now.");
    return data;
  } catch (e) {
    throw toAppError(e);
  }
}
