-- ============================================================================
-- RANGA 000 — Preflight (READ-ONLY). Safe to run any time; changes nothing.
-- Run this first and compare with the programme codes in 003_academic_catalogue.sql.
-- ============================================================================

select 'programmes' as what, code, name, degree from public.programmes order by name;

select p.code as programme, s.code as scheme, s.name as scheme_name,
       (select count(*) from public.semesters x where x.scheme_id = s.id) as semesters
from public.schemes s join public.programmes p on p.id = s.programme_id
order by p.code, s.code;

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name in ('subjects', 'resources')
order by table_name, ordinal_position;

select 'subjects' as what, count(*) from public.subjects
union all select 'resources', count(*) from public.resources;
