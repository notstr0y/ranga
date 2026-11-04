// Generates supabase/manual-sql/003_academic_catalogue.sql and 005_v1_cleanup.sql from supabase/catalogue/data.mjs
//   npm run catalogue:build
import { writeFileSync } from "node:fs";
import { PROGRAMMES, SCHEMES, COURSES, SEMESTERS_2019, SEMESTERS_2024, RETIRED_2024_CODES } from "../supabase/catalogue/data.mjs";

const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined ? "null" : String(v));

// ---- consistency checks (fail loudly rather than emit bad SQL) ----
const byCode = new Map();
for (const c of COURSES) {
  if (c.length !== 9) throw new Error(`Course row has ${c.length} fields: ${c[0]}`);
  if (byCode.has(c[0])) throw new Error(`Duplicate course code in data: ${c[0]}`);
  if (!["verified_official", "verified_secondary", "needs_review"].includes(c[7])) throw new Error(`Bad status: ${c[0]}`);
  byCode.set(c[0], c);
}
const seen = new Set();
const plans = { "2019": SEMESTERS_2019, "2024": SEMESTERS_2024 };
const rows = [];
const counts = {};
for (const [scheme, sems] of Object.entries(plans)) {
  for (const [sem, items] of Object.entries(sems)) {
    const codes = new Set();
    items.forEach(([code, slot], i) => {
      if (!byCode.has(code)) throw new Error(`Unknown course code referenced: ${code}`);
      if (codes.has(code)) throw new Error(`Duplicate ${code} in ${scheme} S${sem}`);
      codes.add(code); seen.add(code);
      rows.push(`  (${q(scheme)}, ${sem}, ${q(code)}, ${q(slot)}, ${i + 1})`);
    });
    counts[`${scheme} S${sem}`] = codes.size;
  }
}
for (const c of byCode.keys()) if (!seen.has(c)) throw new Error(`Course ${c} is defined but never placed in a semester`);

const header003 = `-- ============================================================================
-- RANGA 003 — Academic catalogue (CSE only)
-- GENERATED FILE. Edit supabase/catalogue/data.mjs and run:  npm run catalogue:build
--
-- Requires: 001_schema.sql, 002_permissions_and_rls.sql
-- Seeds:    CSE programme; schemes 2019 and 2024; semesters S1-S8 for both;
--           CSE 2019 subjects S1-S2; CSE 2024 subjects S1-S5 (from the KTU B.Tech Curriculum-2024 PDF).
--           2019 S3-S8 and 2024 S6-S8 are intentionally left empty (nothing unverified is seeded).
-- Safe to re-run: upserts by (programme, scheme, semester, code). Rows added through the developer
-- workspace under other codes are never touched by this file (it deletes nothing).
-- ============================================================================

begin;

insert into public.programmes (code, name, degree, short_name, sort_order, is_active)
values
${PROGRAMMES.map((p) => `  (${q(p[0])}, ${q(p[1])}, ${q(p[2])}, ${q(p[0])}, ${p[3]}, true)`).join(",\n")}
on conflict (code) do update set
  name = excluded.name, degree = excluded.degree,
  short_name = coalesce(public.programmes.short_name, excluded.short_name),
  sort_order = coalesce(public.programmes.sort_order, excluded.sort_order),
  is_active = true;

create temp table _ranga_schemes (programme_code text, scheme_code text, scheme_name text, status text, source_url text) on commit drop;
insert into _ranga_schemes values
${SCHEMES.map((s) => `  (${q(s.programme)}, ${q(s.code)}, ${q(s.name)}, ${q(s.status)}, ${q(s.source)})`).join(",\n")};

insert into public.schemes (programme_id, code, name, source_url, verification_status)
select pr.id, s.scheme_code, s.scheme_name, s.source_url, s.status
from _ranga_schemes s join public.programmes pr on pr.code = s.programme_code
on conflict (programme_id, code) do update set
  name = excluded.name, source_url = excluded.source_url, verification_status = excluded.verification_status;

-- all eight semester records per scheme
insert into public.semesters (scheme_id, semester_number, name)
select sch.id, g.n, 'Semester ' || g.n
from public.schemes sch
join public.programmes pr on pr.id = sch.programme_id
join _ranga_schemes s on s.programme_code = pr.code and s.scheme_code = sch.code
cross join generate_series(1, 8) as g(n)
on conflict (scheme_id, semester_number) do nothing;

-- canonical courses (one row per official code). Rows verified_official are never overwritten.
insert into public.courses (code, name, course_type, course_category, credits, ltp, notes, verification_status, source_url)
values
${COURSES.map((c) => `  (${q(c[0])}, ${q(c[1])}, ${q(c[2])}, ${q(c[3])}, ${n(c[4])}, ${q(c[5])}, ${q(c[6])}, ${q(c[7])}, ${q(c[8])})`).join(",\n")}
on conflict (code) do update set
  name = excluded.name, course_type = excluded.course_type, course_category = excluded.course_category,
  credits = excluded.credits, ltp = excluded.ltp, notes = excluded.notes,
  verification_status = excluded.verification_status, source_url = excluded.source_url
where public.courses.verification_status <> 'verified_official';

create temp table _ranga_sem_rows (scheme_code text, sem int, course_code text, slot text, ord int) on commit drop;
insert into _ranga_sem_rows values
${rows.join(",\n")};

insert into public.subjects
  (semester_id, course_id, code, name, course_type, course_category, credits, course_slot, source_url, verification_status, sort_order)
select sem.id, c.id, c.code, c.name, c.course_type, c.course_category, c.credits, d.slot, c.source_url, c.verification_status, d.ord
from _ranga_sem_rows d
join public.programmes pr on pr.code = 'CSE'
join public.schemes sch on sch.programme_id = pr.id and sch.code = d.scheme_code
join public.semesters sem on sem.scheme_id = sch.id and sem.semester_number = d.sem
join public.courses c on c.code = d.course_code
on conflict (semester_id, code) do update set
  course_id = excluded.course_id, name = excluded.name, course_type = excluded.course_type,
  course_category = excluded.course_category, credits = excluded.credits, course_slot = excluded.course_slot,
  source_url = excluded.source_url, verification_status = excluded.verification_status, sort_order = excluded.sort_order;

commit;
`;

const header005 = `-- ============================================================================
-- RANGA 005 — V1 cleanup: remove non-CSE records and obsolete resource types   *** DESTRUCTIVE ***
-- GENERATED FILE (scripts/build-catalogue-sql.mjs). Run it LAST (after 001–004), and run PART A first.
--
-- PART A  (read-only)  Shows exactly what PART B will touch. Read it before continuing.
-- PART B  (destructive, one transaction) does the following and nothing else:
--   1. Resources of the retired types 'youtube' / 'external' (link-only) are ARCHIVED and re-typed 'other';
--      'assignment' resources are re-typed 'other' (their status is kept).
--   2. Resources attached to non-CSE subjects are DETACHED (subject_id = NULL) and ARCHIVED — never deleted,
--      and their files in storage are not touched.
--   3. Deletes non-CSE subjects, semesters, schemes and programmes.
--   4. Deletes retired CSE-2024 subjects from the old catalogue (codes listed below) ONLY if they have no resources;
--      any that do are kept and flagged needs_review instead.
--   5. Deletes canonical courses that no subject references any more.
--   6. Narrows the resource_type CHECK to the five V1 categories and validates it.
-- Nothing here drops a table, and CSE subjects with resources are never deleted.
-- ============================================================================

-- ---------- PART A: preview (read-only) ----------
select 'non-CSE programmes' as what, count(*) from public.programmes where code <> 'CSE'
union all select 'non-CSE schemes', count(*) from public.schemes s join public.programmes p on p.id = s.programme_id where p.code <> 'CSE'
union all select 'non-CSE subjects', count(*) from public.subjects sub
  join public.semesters sem on sem.id = sub.semester_id join public.schemes s on s.id = sem.scheme_id
  join public.programmes p on p.id = s.programme_id where p.code <> 'CSE'
union all select 'resources on non-CSE subjects (will be detached + archived)', count(*) from public.resources r
  join public.subjects sub on sub.id = r.subject_id join public.semesters sem on sem.id = sub.semester_id
  join public.schemes s on s.id = sem.scheme_id join public.programmes p on p.id = s.programme_id where p.code <> 'CSE'
union all select 'link-only resources (youtube/external, will be archived)', count(*) from public.resources where resource_type in ('youtube', 'external')
union all select 'assignment resources (will become other)', count(*) from public.resources where resource_type = 'assignment'
union all select 'published question papers with no year (fix these)', count(*) from public.resources where resource_type = 'pyq' and academic_year is null;

select p.code as programme, s.code as scheme, count(sub.id) as subjects
from public.programmes p
left join public.schemes s on s.programme_id = p.id
left join public.semesters sem on sem.scheme_id = s.id
left join public.subjects sub on sub.semester_id = sem.id
where p.code <> 'CSE' group by p.code, s.code order by 1, 2;

-- ---------- PART B: destructive ----------
begin;

do $$ begin
  if not exists (select 1 from public.programmes where code = 'CSE') then
    raise exception 'CSE programme not found — run 003_academic_catalogue.sql first. Nothing was changed.';
  end if;
end $$;

-- the year rule is lifted for the duration of this transaction so legacy question papers without a year
-- can still be archived/re-typed here; it is re-added (NOT VALID: new and edited rows only) at the end.
alter table public.resources drop constraint if exists resources_pyq_requires_year;

-- 1. retired resource types (first: the new CHECK rejects any update that leaves a legacy type in place)
update public.resources set status = 'archived', resource_type = 'other' where resource_type in ('youtube', 'external');
update public.resources set resource_type = 'other' where resource_type = 'assignment';

-- 2. detach + archive resources of non-CSE subjects
update public.resources r
set status = 'archived', subject_id = null
where r.subject_id in (
  select sub.id from public.subjects sub
  join public.semesters sem on sem.id = sub.semester_id
  join public.schemes s on s.id = sem.scheme_id
  join public.programmes p on p.id = s.programme_id
  where p.code <> 'CSE');

-- 3. non-CSE catalogue
delete from public.subjects where semester_id in (
  select sem.id from public.semesters sem join public.schemes s on s.id = sem.scheme_id
  join public.programmes p on p.id = s.programme_id where p.code <> 'CSE');
delete from public.semesters where scheme_id in (
  select s.id from public.schemes s join public.programmes p on p.id = s.programme_id where p.code <> 'CSE');
delete from public.schemes where programme_id in (select id from public.programmes where code <> 'CSE');
delete from public.programmes where code <> 'CSE';

-- 4. retired CSE-2024 subjects from the pre-V1 catalogue
create temp table _retired (code text primary key) on commit drop;
insert into _retired values ${RETIRED_2024_CODES.map((c) => `(${q(c)})`).join(", ")};

update public.subjects sub set verification_status = 'needs_review'
from public.semesters sem, public.schemes s, public.programmes p
where sem.id = sub.semester_id and s.id = sem.scheme_id and p.id = s.programme_id
  and p.code = 'CSE' and s.code = '2024' and sub.code in (select code from _retired)
  and exists (select 1 from public.resources r where r.subject_id = sub.id);

delete from public.subjects sub
using public.semesters sem, public.schemes s, public.programmes p
where sem.id = sub.semester_id and s.id = sem.scheme_id and p.id = s.programme_id
  and p.code = 'CSE' and s.code = '2024' and sub.code in (select code from _retired)
  and not exists (select 1 from public.resources r where r.subject_id = sub.id);

-- 5. orphan canonical courses
delete from public.courses c where not exists (select 1 from public.subjects s where s.course_id = c.id);

-- 6. five V1 categories only
alter table public.resources drop constraint if exists resources_resource_type_check;
alter table public.resources add constraint resources_resource_type_check
  check (resource_type in ('pyq', 'notes', 'study_material', 'lab', 'other'));
alter table public.resources add constraint resources_pyq_requires_year
  check (resource_type <> 'pyq' or (academic_year is not null and academic_year between 2000 and 2100)) not valid;

commit;

-- ---------- after PART B ----------
select 'programmes' as what, count(*) from public.programmes union all
select 'schemes', count(*) from public.schemes union all
select 'subjects', count(*) from public.subjects union all
select 'resources', count(*) from public.resources;
`;

const validation = `-- ============================================================================
-- RANGA 006 — Catalogue validation (READ-ONLY). Run after 003 and 005.
-- ============================================================================

-- 1. Programmes: only CSE should be present in V1
select code, name, is_active from public.programmes order by sort_order nulls last, code;

-- 2. Semester coverage per scheme (expect 8 each) and subject counts
select p.code as programme, s.code as scheme, sem.semester_number as sem, count(sub.id) as subjects,
       count(*) filter (where sub.verification_status = 'needs_review') as needs_review
from public.programmes p
join public.schemes s on s.programme_id = p.id
join public.semesters sem on sem.scheme_id = s.id
left join public.subjects sub on sub.semester_id = sem.id
group by p.code, s.code, sem.semester_number order by 1, 2, 3;

-- 3. Schemes without all eight semesters (expect 0 rows)
select p.code, s.code, count(sem.id) as semesters
from public.schemes s join public.programmes p on p.id = s.programme_id
left join public.semesters sem on sem.scheme_id = s.id
group by p.code, s.code having count(sem.id) <> 8;

-- 4. Duplicate subject codes within one scheme + semester (expect 0 rows)
select p.code, s.code as scheme, sem.semester_number, sub.code, count(*)
from public.subjects sub join public.semesters sem on sem.id = sub.semester_id
join public.schemes s on s.id = sem.scheme_id join public.programmes p on p.id = s.programme_id
group by 1, 2, 3, 4 having count(*) > 1;

-- 5. Same code appearing in two different semesters of one scheme (informational: UCHUT346/347, UCHWT127, ... are
--    intentionally offered in two semesters)
select p.code, s.code as scheme, sub.code, array_agg(sem.semester_number order by sem.semester_number) as semesters
from public.subjects sub join public.semesters sem on sem.id = sub.semester_id
join public.schemes s on s.id = sem.scheme_id join public.programmes p on p.id = s.programme_id
group by 1, 2, 3 having count(*) > 1 order by 1, 2, 3;

-- 6. Entries that are not verified
select p.code, s.code as scheme, sem.semester_number, sub.code, sub.name, sub.verification_status
from public.subjects sub join public.semesters sem on sem.id = sub.semester_id
join public.schemes s on s.id = sem.scheme_id join public.programmes p on p.id = s.programme_id
where sub.verification_status = 'needs_review' order by 1, 2, 3, 4;

-- 7. Subjects missing a source
select code, name from public.subjects where source_url is null;

-- 8. Resource rules (expect 0 rows each)
select id, title from public.resources where resource_type not in ('pyq', 'notes', 'study_material', 'lab', 'other');
select id, title from public.resources where resource_type = 'pyq' and academic_year is null;
select id, title, resource_type, academic_year from public.resources where resource_type <> 'pyq' and academic_year is not null;
`;

writeFileSync(new URL("../supabase/manual-sql/003_academic_catalogue.sql", import.meta.url), header003);
writeFileSync(new URL("../supabase/manual-sql/005_v1_cleanup.sql", import.meta.url), header005);
writeFileSync(new URL("../supabase/manual-sql/006_validate_catalogue.sql", import.meta.url), validation);
console.log("courses:", COURSES.length);
console.log(counts);
