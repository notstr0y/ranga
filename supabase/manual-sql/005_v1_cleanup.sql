-- ============================================================================
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
insert into _retired values ('GACYT122'), ('GYEST103'), ('GAEST104'), ('GAESL106'), ('UCPST127'), ('GAEST203'), ('GAEST204'), ('GAESL208');

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
