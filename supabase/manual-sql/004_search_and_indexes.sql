-- ============================================================================
-- RANGA 004 — Search indexes, the public resource view and search functions (idempotent)
-- Depends on: 001, 002 (003 is not required, but there is nothing to search without it)
-- ============================================================================

-- ---------- indexes ----------
create index if not exists idx_subjects_semester_order on public.subjects (semester_id, sort_order, code);
create index if not exists idx_subjects_course on public.subjects (course_id);
create index if not exists idx_resources_subject_status on public.resources (subject_id, status, resource_type);
create index if not exists idx_resources_published_recent on public.resources (created_at desc) where status = 'published';
drop index if exists public.idx_resources_year;
create index if not exists idx_resources_pyq_year on public.resources (academic_year desc, subject_id)
  where status = 'published' and resource_type = 'pyq';
create index if not exists idx_resources_type_recent on public.resources (resource_type, created_at desc)
  where status = 'published';
create index if not exists idx_resources_exam_session_trgm on public.resources using gin (exam_session gin_trgm_ops);
create index if not exists idx_subjects_code_nospace on public.subjects (lower(replace(code, ' ', '')));

create index if not exists idx_subjects_name_trgm on public.subjects using gin (name gin_trgm_ops);
create index if not exists idx_subjects_code_trgm on public.subjects using gin (code gin_trgm_ops);
create index if not exists idx_resources_title_trgm on public.resources using gin (title gin_trgm_ops);
create index if not exists idx_programmes_name_trgm on public.programmes using gin (name gin_trgm_ops);

-- ---------- public resource view (published only, no storage keys) ----------
-- security_invoker: the caller's RLS and column grants apply, so file_key is never reachable.
create or replace view public.resource_catalogue
with (security_invoker = true) as
select
  r.id, r.title, r.description, r.resource_type, r.academic_year, r.exam_session, r.exam_type,
  r.file_name, r.file_size_bytes, r.mime_type, r.external_url,
  (r.external_url is null) as has_file,     -- the XOR check guarantees: no link => stored file
  r.created_at,
  s.id as subject_id, s.code as subject_code, s.name as subject_name,
  sem.id as semester_id, sem.semester_number,
  sch.id as scheme_id, sch.code as scheme_code, sch.name as scheme_name,
  p.id as programme_id, p.code as programme_code, p.name as programme_name
from public.resources r
left join public.subjects  s   on s.id = r.subject_id
left join public.semesters sem on sem.id = s.semester_id
left join public.schemes   sch on sch.id = sem.scheme_id
left join public.programmes p  on p.id = sch.programme_id
where r.status = 'published';

grant select on public.resource_catalogue to anon, authenticated;

-- ---------- helper: escape LIKE wildcards in user input ----------
create or replace function public.ranga_like_pattern(q text)
returns text language sql immutable as $$
  select '%' || replace(replace(replace(trim(coalesce(q, '')), '\', '\\'), '%', '\%'), '_', '\_') || '%'
$$;

-- ---------- search_resources ----------
create or replace function public.search_resources(
  q text default null,
  p_programme text default null,      -- programme CODE, e.g. 'CSE'
  p_scheme text default null,         -- scheme CODE, e.g. '2019'
  p_semester smallint default null,
  p_type text default null,
  p_year integer default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid, title text, description text, resource_type text, academic_year integer,
  exam_session text, exam_type text, file_name text, file_size_bytes bigint, external_url text,
  has_file boolean, created_at timestamptz,
  subject_id uuid, subject_code text, subject_name text, semester_number smallint,
  scheme_id uuid, scheme_code text, scheme_name text, programme_id uuid, programme_code text,
  programme_name text, total_count bigint
)
language sql stable security invoker set search_path = public, extensions
as $$
  with pat as (select public.ranga_like_pattern(q) as p, (trim(coalesce(q, '')) = '') as blank)
  select c.id, c.title, c.description, c.resource_type, c.academic_year, c.exam_session, c.exam_type,
         c.file_name, c.file_size_bytes, c.external_url, c.has_file, c.created_at,
         c.subject_id, c.subject_code, c.subject_name, c.semester_number,
         c.scheme_id, c.scheme_code, c.scheme_name, c.programme_id, c.programme_code,
         c.programme_name, count(*) over () as total_count
  from public.resource_catalogue c, pat
  where (pat.blank or c.title ilike pat.p or c.description ilike pat.p or c.subject_code ilike pat.p
         or replace(lower(c.subject_code), ' ', '') like replace(lower(pat.p), ' ', '')
         or c.subject_name ilike pat.p or c.programme_name ilike pat.p or c.programme_code ilike pat.p
         or c.exam_session ilike pat.p
         or (c.academic_year is not null and c.academic_year::text = trim(coalesce(q, ''))))
    and (p_programme is null or c.programme_code = p_programme)
    and (p_scheme    is null or c.scheme_code = p_scheme)
    and (p_semester  is null or c.semester_number = p_semester)
    and (p_type      is null or c.resource_type = p_type)
    and (p_year      is null or (c.resource_type = 'pyq' and c.academic_year = p_year))
  order by c.created_at desc, c.id
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0)
$$;

-- ---------- search_subjects ----------
create or replace function public.search_subjects(
  q text default null,
  p_programme text default null,      -- programme CODE
  p_scheme text default null,         -- scheme CODE
  p_semester smallint default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid, code text, name text, course_type text, course_category text, credits numeric,
  verification_status text, semester_id uuid, semester_number smallint,
  scheme_id uuid, scheme_code text, scheme_name text, programme_id uuid, programme_code text,
  programme_name text, resource_count bigint, total_count bigint
)
language sql stable security invoker set search_path = public, extensions
as $$
  with pat as (select public.ranga_like_pattern(q) as p, (trim(coalesce(q, '')) = '') as blank)
  select s.id, s.code, s.name, s.course_type, s.course_category, s.credits, s.verification_status,
         sem.id, sem.semester_number, sch.id, sch.code, sch.name, p.id, p.code, p.name,
         (select count(*) from public.resources r where r.subject_id = s.id and r.status = 'published'),
         count(*) over ()
  from public.subjects s
  join public.semesters sem on sem.id = s.semester_id
  join public.schemes sch on sch.id = sem.scheme_id
  join public.programmes p on p.id = sch.programme_id, pat
  where (pat.blank or s.code ilike pat.p or replace(lower(s.code), ' ', '') like replace(lower(pat.p), ' ', '')
         or s.name ilike pat.p or p.name ilike pat.p or p.code ilike pat.p)
    and (p_programme is null or p.code = p_programme)
    and (p_scheme    is null or sch.code = p_scheme)
    and (p_semester  is null or sem.semester_number = p_semester)
  order by p.sort_order nulls last, p.name, sch.code, sem.semester_number, s.sort_order nulls last, s.code
  limit least(greatest(p_limit, 1), 50) offset greatest(p_offset, 0)
$$;

-- ---------- semester_subjects: subjects of one semester with real resource counts ----------
create or replace function public.semester_subjects(p_semester uuid)
returns table (
  id uuid, code text, name text, course_type text, course_category text, credits numeric,
  course_slot text, verification_status text, resource_count bigint
)
language sql stable security invoker set search_path = public
as $$
  select s.id, s.code, s.name, s.course_type, s.course_category, s.credits, s.course_slot,
         s.verification_status,
         (select count(*) from public.resources r where r.subject_id = s.id and r.status = 'published')
  from public.subjects s
  where s.semester_id = p_semester
  order by s.sort_order nulls last, s.code
$$;

-- ---------- resource_type_counts: real numbers for the home screen ----------
create or replace function public.resource_type_counts()
returns table (resource_type text, total bigint)
language sql stable security invoker set search_path = public
as $$
  select r.resource_type, count(*) from public.resources r where r.status = 'published' group by r.resource_type
$$;

grant execute on function public.search_resources(text, text, text, smallint, text, integer, integer, integer) to anon, authenticated;
grant execute on function public.search_subjects(text, text, text, smallint, integer, integer) to anon, authenticated;
-- ---------- resource_years: distinct years that have published QUESTION PAPERS (year is a pyq-only field) ----------
create or replace function public.resource_years()
returns table (academic_year integer)
language sql stable security invoker set search_path = public
as $$
  select distinct r.academic_year from public.resources r
  where r.status = 'published' and r.resource_type = 'pyq' and r.academic_year is not null order by 1 desc
$$;
grant execute on function public.resource_years() to anon, authenticated;

grant execute on function public.semester_subjects(uuid) to anon, authenticated;
grant execute on function public.resource_type_counts() to anon, authenticated;
