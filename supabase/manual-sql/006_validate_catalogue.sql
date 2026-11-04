-- ============================================================================
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
