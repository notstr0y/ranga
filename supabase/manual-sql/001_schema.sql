-- ============================================================================
-- RANGA 001 — Schema (additive, idempotent)
--
-- * Creates any missing base tables (fresh database) — existing tables are untouched.
-- * Adds new columns, constraints and indexes only with IF NOT EXISTS guards.
-- * Never drops tables or deletes rows. Constraints replaced on public.resources:
--     - resource_type CHECK: narrowed to the five V1 categories (added NOT VALID so existing legacy rows
--       do not block this script; 005_v1_cleanup.sql converts them and re-adds the check validated)
--     - resources_link_types_have_url: removed (YouTube / external-link resources no longer exist)
--     - NEW resources_pyq_requires_year: question papers (pyq) must carry a plausible year; other
--       categories may leave academic_year NULL (NOT VALID = enforced for new/updated rows only)
-- Run order: 000 (optional) -> 001 -> 002 -> 003 -> 004 -> 005 (destructive cleanup, read it first) -> 006 (validate)
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ---------- helper: updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- base tables (no-ops when they already exist) ----------
create table if not exists public.programmes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  degree text not null default 'B.Tech',
  created_at timestamptz not null default now()
);

create table if not exists public.schemes (
  id uuid primary key default gen_random_uuid(),
  programme_id uuid not null references public.programmes(id),
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (programme_id, code)
);

create table if not exists public.semesters (
  id uuid primary key default gen_random_uuid(),
  scheme_id uuid not null references public.schemes(id),
  semester_number smallint not null check (semester_number between 1 and 8),
  name text not null,
  unique (scheme_id, semester_number)
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id),
  code text not null,
  name text not null,
  created_at timestamptz not null default now(),
  unique (semester_id, code)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id),
  title text not null,
  description text,
  resource_type text not null default 'other',
  academic_year integer,
  exam_session text,
  file_key text,
  external_url text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((file_key is not null and external_url is null) or (file_key is null and external_url is not null))
);

-- ---------- programmes ----------
alter table public.programmes add column if not exists short_name text;
alter table public.programmes add column if not exists curriculum_group_2024 text;
alter table public.programmes add column if not exists sort_order integer;
alter table public.programmes add column if not exists is_active boolean not null default true;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'programmes_curriculum_group_2024_check') then
    alter table public.programmes add constraint programmes_curriculum_group_2024_check
      check (curriculum_group_2024 is null or curriculum_group_2024 in ('A', 'B', 'C', 'D'));
  end if;
end $$;

-- ---------- schemes ----------
alter table public.schemes add column if not exists source_url text;
alter table public.schemes add column if not exists notes text;
alter table public.schemes add column if not exists verification_status text not null default 'needs_review';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'schemes_verification_status_check') then
    alter table public.schemes add constraint schemes_verification_status_check
      check (verification_status in ('verified_official', 'verified_secondary', 'needs_review'));
  end if;
end $$;

-- ---------- courses: one canonical row per official course code ----------
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  course_type text,          -- theory | lab | workshop | project | seminar | elective | other
  course_category text,      -- BSC, ESC, PCC, PEC, MNC ... as printed by KTU
  credits numeric(3,1),
  ltp text,                  -- L-T-P (2019) or L-T-P-R (2024), as printed
  notes text,
  source_url text,
  verification_status text not null default 'needs_review'
    check (verification_status in ('verified_official', 'verified_secondary', 'needs_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- subjects (an offering of a course in a given semester) ----------
-- course_type / course_category / credits already exist in the live database; these are no-ops there.
alter table public.subjects add column if not exists course_id uuid references public.courses(id);
alter table public.subjects add column if not exists course_type text;
alter table public.subjects add column if not exists course_category text;
alter table public.subjects add column if not exists credits numeric(3,1);
alter table public.subjects add column if not exists course_slot text;
alter table public.subjects add column if not exists source_url text;
alter table public.subjects add column if not exists verification_status text not null default 'needs_review';
alter table public.subjects add column if not exists sort_order integer;
alter table public.subjects add column if not exists updated_at timestamptz not null default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subjects_verification_status_check') then
    alter table public.subjects add constraint subjects_verification_status_check
      check (verification_status in ('verified_official', 'verified_secondary', 'needs_review'));
  end if;
end $$;

-- Back-fill: turn pre-existing subject rows into canonical courses (flagged needs_review,
-- because their origin is unknown) and link them. Existing data is not modified.
insert into public.courses (code, name, course_type, course_category, credits, verification_status)
select distinct on (s.code) s.code, s.name, s.course_type, s.course_category, s.credits, 'needs_review'
from public.subjects s
order by s.code, s.created_at
on conflict (code) do nothing;

update public.subjects s
set course_id = c.id
from public.courses c
where s.course_id is null and c.code = s.code;

-- ---------- resources: richer metadata ----------
alter table public.resources add column if not exists exam_type text;
alter table public.resources add column if not exists file_name text;
alter table public.resources add column if not exists file_size_bytes bigint;
alter table public.resources add column if not exists mime_type text;
alter table public.resources add column if not exists sha256 text;      -- duplicate detection for uploaded files
alter table public.resources add column if not exists published_at timestamptz;

do $$ begin
  -- five V1 categories (NOT VALID: legacy rows are converted by 005, which then validates)
  if exists (select 1 from pg_constraint
             where conrelid = 'public.resources'::regclass and conname = 'resources_resource_type_check') then
    alter table public.resources drop constraint resources_resource_type_check;
  end if;
  alter table public.resources add constraint resources_resource_type_check
    check (resource_type in ('pyq', 'notes', 'study_material', 'lab', 'other')) not valid;

  if not exists (select 1 from pg_constraint where conname = 'resources_exam_type_check') then
    alter table public.resources add constraint resources_exam_type_check
      check (exam_type is null or exam_type in ('end_semester', 'supplementary', 'series_test', 'model', 'other'));
  end if;

  -- links are no longer a user-facing resource type
  if exists (select 1 from pg_constraint where conname = 'resources_link_types_have_url') then
    alter table public.resources drop constraint resources_link_types_have_url;
  end if;

  -- year: required for question papers, optional (NULL) for everything else
  if not exists (select 1 from pg_constraint where conname = 'resources_pyq_requires_year') then
    alter table public.resources add constraint resources_pyq_requires_year
      check (resource_type <> 'pyq' or (academic_year is not null and academic_year between 2000 and 2100)) not valid;
  end if;
end $$;

-- duplicate protection
create unique index if not exists resources_sha256_key
  on public.resources (sha256) where sha256 is not null;
drop index if exists public.resources_link_per_subject_key;   -- external links are no longer a resource type

-- ---------- updated_at triggers ----------
drop trigger if exists trg_resources_updated_at on public.resources;
create trigger trg_resources_updated_at before update on public.resources
  for each row execute function public.set_updated_at();
drop trigger if exists trg_subjects_updated_at on public.subjects;
create trigger trg_subjects_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();
drop trigger if exists trg_courses_updated_at on public.courses;
create trigger trg_courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
