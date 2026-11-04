export type VerificationStatus = "verified_official" | "verified_secondary" | "needs_review";

/** The five V1 categories. Only "pyq" (question paper) carries a year. */
export type ResourceType = "pyq" | "notes" | "study_material" | "lab" | "other";

export type ExamType = "end_semester" | "supplementary" | "series_test" | "model" | "other";

export interface Programme {
  id: string;
  code: string;
  name: string;
  degree: string;
}

export interface Scheme {
  id: string;
  code: string;
  name: string;
  verification_status: VerificationStatus;
}

export interface Semester {
  id: string;
  semester_number: number;
  name: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  course_type: string | null;
  course_category: string | null;
  credits: number | null;
  course_slot: string | null;
  verification_status: VerificationStatus;
  resource_count: number;
}

export interface SubjectDetail {
  id: string;
  code: string;
  name: string;
  course_type: string | null;
  course_category: string | null;
  credits: number | null;
  course_slot: string | null;
  verification_status: VerificationStatus;
  semester: {
    id: string;
    semester_number: number;
    name: string;
    scheme: { id: string; code: string; name: string; programme: { id: string; code: string; name: string } };
  };
}

export interface SubjectHit {
  id: string;
  code: string;
  name: string;
  course_type: string | null;
  course_category: string | null;
  credits: number | null;
  verification_status: VerificationStatus;
  semester_number: number;
  scheme_code: string;
  scheme_name: string;
  programme_code: string;
  programme_name: string;
  resource_count: number;
}

/** A row of the public `resource_catalogue` view. */
export interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  academic_year: number | null;
  exam_session: string | null;
  exam_type: ExamType | null;
  file_name: string | null;
  file_size_bytes: number | null;
  created_at: string;
  subject_id: string | null;
  subject_code: string | null;
  subject_name: string | null;
  semester_id: string | null;
  semester_number: number | null;
  scheme_code: string | null;
  scheme_name: string | null;
  programme_code: string | null;
  programme_name: string | null;
}

export interface Page<T> {
  rows: T[];
  total: number;
}

export interface SearchFilters {
  q?: string;
  programme?: string;
  scheme?: string;
  semester?: number;
  type?: ResourceType;
  year?: number;
}
