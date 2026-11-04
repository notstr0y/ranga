-- ============================================================================
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
  ('CSE', 'Computer Science and Engineering', 'B.Tech', 'CSE', 10, true)
on conflict (code) do update set
  name = excluded.name, degree = excluded.degree,
  short_name = coalesce(public.programmes.short_name, excluded.short_name),
  sort_order = coalesce(public.programmes.sort_order, excluded.sort_order),
  is_active = true;

create temp table _ranga_schemes (programme_code text, scheme_code text, scheme_name text, status text, source_url text) on commit drop;
insert into _ranga_schemes values
  ('CSE', '2019', '2019 Scheme', 'verified_secondary', 'https://cse.cet.ac.in/wp-content/uploads/2024/08/COMPUTERSCIENCEANDENGINEERINGS1-S8-.pdf'),
  ('CSE', '2024', '2024 Scheme', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)');

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
  ('MAT101', 'Linear Algebra and Calculus', 'theory', 'BSC', 4, '3-1-0', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('MAT102', 'Vector Calculus, Differential Equations and Transforms', 'theory', 'BSC', 4, '3-1-0', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('PHT100', 'Engineering Physics A', 'theory', 'BSC', 4, '3-1-0', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('PHT110', 'Engineering Physics B', 'theory', 'BSC', 4, '3-1-0', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('CYT100', 'Engineering Chemistry', 'theory', 'BSC', 4, '3-1-0', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('EST100', 'Engineering Mechanics', 'theory', 'ESC', 3, '2-1-0', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('EST110', 'Engineering Graphics', 'theory', 'ESC', 3, '2-0-2', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('EST120', 'Basics of Civil and Mechanical Engineering', 'theory', 'ESC', 4, '4-0-0', 'Printed as “Basics of Civil & Mechanical Engineering” in the S1–S8 syllabus', 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('EST130', 'Basics of Electrical and Electronics Engineering', 'theory', 'ESC', 4, '4-0-0', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('EST102', 'Programming in C', 'theory', 'ESC', 4, '2-1-2', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('HUN101', 'Life Skills', 'theory', 'MNC', null, '2-0-2', 'Mandatory non-credit course', 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('HUN102', 'Professional Communication', 'theory', 'MNC', null, '2-0-2', 'Mandatory non-credit course', 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('PHL120', 'Engineering Physics Lab', 'lab', 'BSC', 1, '0-0-2', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('CYL120', 'Engineering Chemistry Lab', 'lab', 'BSC', 1, '0-0-2', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('ESL120', 'Civil and Mechanical Workshop', 'workshop', 'ESC', 1, '0-0-2', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('ESL130', 'Electrical and Electronics Workshop', 'workshop', 'ESC', 1, '0-0-2', null, 'verified_secondary', 'https://library.cethalassery.ac.in/images/KTU/Curriculum%20for%20S1%20and%20S2_KTU.pdf'),
  ('GAMAT101', 'Mathematics for Information Science-1', 'theory', 'BSC', 3, '3-0-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GAPHT121', 'Physics for Information Science', 'theory', 'BSC', 4, '3-0-2-0', 'Offered in S1 or S2 (slot B)', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GXCYT122', 'Chemistry for Information Science', 'theory', 'BSC', 4, '3-0-2-0', 'Offered in S1 or S2 (slot B)', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GMEST103', 'Engineering Graphics and Computer Aided Drawing', 'theory', 'ESC', 3, '2-0-2-0', 'Printed with a trailing full stop in the source', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GXEST104', 'Introduction to Electrical & Electronics Engineering', 'theory', 'ESC', 4, '2-0-0-0', 'Two parts: Electrical Engineering (2) + Electronics Engineering (2)', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('UCEST105', 'Algorithmic Thinking with Python', 'theory', 'ESC', 4, '3-0-2-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GXESL106', 'Basic Electrical and Electronics Engineering Workshop', 'workshop', 'ESC', 1, '0-0-2-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('UCHWT127', 'Health and Wellness', 'other', 'HWP', 1, '1-0-1-0', 'No grade points are awarded; offered in S1 or S2 (slot I)', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('UCHUT128', 'Life Skills and Professional Communication', 'theory', 'HMC', 1, '2-0-1-0', 'Offered in S1 or S2 (slot I); valued at college level', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('UCSEM129', 'Skill Enhancement Course: Digital 101 (NASSCOM)', 'other', 'SEC', 1, null, 'MOOC; may be completed in S1 or S2; credit is recorded in the S2 grade card', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GAMAT201', 'Mathematics for Information Science-2', 'theory', 'BSC', 3, '3-0-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GXEST203', 'Foundations of Computing: From Hardware Essentials to Web Design', 'theory', 'ESC', 3, '3-0-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GXEST204', 'Programming in C', 'theory', 'ESC', 4, '3-0-2-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCST205', 'Discrete Mathematics', 'theory', 'PC', 4, '3-1-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('UCEST206', 'Engineering Entrepreneurship & IPR', 'theory', 'ESC', 3, '3-0-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GXESL208', 'IT Workshop', 'workshop', 'ESC', 1, '0-0-2-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GAMAT301', 'Mathematics for Information Science-3', 'theory', 'BSC', 3, '3-0-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCST302', 'Theory of Computation', 'theory', 'PC', 4, '3-1-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCST303', 'Data Structures and Algorithms', 'theory', 'PC', 4, '3-1-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PBCST304', 'Object Oriented Programming', 'theory', 'PCPBL', 4, '3-0-0-1', 'Project based learning (PBL) course', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GAEST305', 'Digital Electronics & Logic Design', 'theory', 'ESC', 4, '3-1-0-0', 'L-T-P-R printed with one column missing in the source; 3-1-0-0 inferred from the 4 hours/week', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('UCHUT346', 'Economics for Engineers', 'theory', 'HMC', 2, '2-0-0-0', 'Offered in S3 or S4 (slot G). Code-to-title pairing read from stacked rows — confirm against the original KTU PDF', 'needs_review', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('UCHUT347', 'Engineering Ethics and Sustainable Development', 'theory', 'HMC', 2, '2-0-0-0', 'Offered in S3 or S4 (slot G). Code-to-title pairing read from stacked rows — confirm against the original KTU PDF', 'needs_review', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCSL307', 'Data Structures Lab', 'lab', 'PCL', 2, '0-0-3-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCSL308', 'Digital Lab', 'lab', 'PCL', 2, '0-0-3-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('GAMAT401', 'Mathematics for Information Science-4', 'theory', 'BSC', 3, '3-0-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCST402', 'Database Management Systems', 'theory', 'PC', 4, '3-1-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCST403', 'Operating Systems', 'theory', 'PC', 4, '3-1-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PBCST404', 'Computer Organization and Architecture', 'theory', 'PCPBL', 4, '3-0-0-1', 'Project based learning (PBL) course', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST411', 'Software Engineering', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST412', 'Pattern Recognition', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST413', 'Functional Programming', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST414', 'Coding Theory', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST415', 'VLSI Design', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1. Level-5 course: printed credit 5/3 — 3 credits, plus 2 more if the B.Tech-2024 eligibility conditions are met', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST416', 'Signals And Systems', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST417', 'Soft Computing', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST418', 'Computational Geometry', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST419', 'Cyber Ethics, Privacy, And Legal Issues', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST495', 'Advanced Data Structures', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 1. Level-5 course: printed credit 5/3 — 3 credits, plus 2 more if the B.Tech-2024 eligibility conditions are met', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCSL407', 'Operating Systems Lab', 'lab', 'PCL', 2, '0-0-3-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCSL408', 'DBMS Lab', 'lab', 'PCL', 2, '0-0-3-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCST501', 'Computer Networks', 'theory', 'PC', 4, '3-1-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCST502', 'Design and Analysis of Algorithms', 'theory', 'PC', 4, '3-1-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCST503', 'Machine Learning', 'theory', 'PC', 3, '3-0-0-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PBCST504', 'Microcontrollers', 'theory', 'PCPBL', 4, '3-0-0-1', 'Project based learning (PBL) course', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST521', 'Software Project Management', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST522', 'Artificial Intelligence', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST523', 'Data Analytics', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST524', 'Data Compression', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST525', 'Data Mining', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2. Level-5 course: printed credit 5/3 — 3 credits, plus 2 more if the B.Tech-2024 eligibility conditions are met', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST526', 'Digital Signal Processing', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST527', 'Computer Graphics & Multimedia', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST528', 'Advanced Computer Architectures', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PECST595', 'Advanced Graph Algorithms', 'elective', 'PE', 3, '3-0-0-0', 'Programme Elective 2. Level-5 course: printed credit 5/3 — 3 credits, plus 2 more if the B.Tech-2024 eligibility conditions are met', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('UCHUM506', 'Constitution Of India (MOOC)', 'other', 'HMC', 1, null, 'MOOC; no grade points are awarded (slot I)', 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCSL507', 'Networks Lab', 'lab', 'PCL', 2, '0-0-3-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)'),
  ('PCCSL508', 'Machine Learning Lab', 'lab', 'PCL', 2, '0-0-3-0', null, 'verified_secondary', 'KTU B.Tech Curriculum-2024, Computer Science and Engineering (Branch Code CS, Group A) — PDF supplied by the project owner (Computer_Science___Engg.pdf)')
on conflict (code) do update set
  name = excluded.name, course_type = excluded.course_type, course_category = excluded.course_category,
  credits = excluded.credits, ltp = excluded.ltp, notes = excluded.notes,
  verification_status = excluded.verification_status, source_url = excluded.source_url
where public.courses.verification_status <> 'verified_official';

create temp table _ranga_sem_rows (scheme_code text, sem int, course_code text, slot text, ord int) on commit drop;
insert into _ranga_sem_rows values
  ('2019', 1, 'MAT101', 'A', 1),
  ('2019', 1, 'PHT100', 'B 1/2', 2),
  ('2019', 1, 'PHT110', 'B 1/2', 3),
  ('2019', 1, 'CYT100', 'B 1/2', 4),
  ('2019', 1, 'EST100', 'C 1/2', 5),
  ('2019', 1, 'EST110', 'C 1/2', 6),
  ('2019', 1, 'EST120', 'D 1/2', 7),
  ('2019', 1, 'EST130', 'D 1/2', 8),
  ('2019', 1, 'HUN101', 'E', 9),
  ('2019', 1, 'PHL120', 'S 1/2', 10),
  ('2019', 1, 'CYL120', 'S 1/2', 11),
  ('2019', 1, 'ESL120', 'T 1/2', 12),
  ('2019', 1, 'ESL130', 'T 1/2', 13),
  ('2019', 2, 'MAT102', 'A', 1),
  ('2019', 2, 'PHT100', 'B 1/2', 2),
  ('2019', 2, 'PHT110', 'B 1/2', 3),
  ('2019', 2, 'CYT100', 'B 1/2', 4),
  ('2019', 2, 'EST100', 'C 1/2', 5),
  ('2019', 2, 'EST110', 'C 1/2', 6),
  ('2019', 2, 'EST120', 'D 1/2', 7),
  ('2019', 2, 'EST130', 'D 1/2', 8),
  ('2019', 2, 'HUN102', 'E', 9),
  ('2019', 2, 'EST102', 'F', 10),
  ('2019', 2, 'PHL120', 'S 1/2', 11),
  ('2019', 2, 'CYL120', 'S 1/2', 12),
  ('2019', 2, 'ESL120', 'T 1/2', 13),
  ('2019', 2, 'ESL130', 'T 1/2', 14),
  ('2024', 1, 'GAMAT101', 'A', 1),
  ('2024', 1, 'GAPHT121', 'B', 2),
  ('2024', 1, 'GXCYT122', 'B', 3),
  ('2024', 1, 'GMEST103', 'C', 4),
  ('2024', 1, 'GXEST104', 'D', 5),
  ('2024', 1, 'UCEST105', 'F', 6),
  ('2024', 1, 'GXESL106', 'L', 7),
  ('2024', 1, 'UCHWT127', 'I', 8),
  ('2024', 1, 'UCHUT128', 'I', 9),
  ('2024', 1, 'UCSEM129', null, 10),
  ('2024', 2, 'GAMAT201', 'A', 1),
  ('2024', 2, 'GAPHT121', 'B', 2),
  ('2024', 2, 'GXCYT122', 'B', 3),
  ('2024', 2, 'GXEST203', 'C', 4),
  ('2024', 2, 'GXEST204', 'D', 5),
  ('2024', 2, 'PCCST205', 'E', 6),
  ('2024', 2, 'UCEST206', 'F', 7),
  ('2024', 2, 'GXESL208', 'L', 8),
  ('2024', 2, 'UCHWT127', 'I', 9),
  ('2024', 2, 'UCHUT128', 'I', 10),
  ('2024', 2, 'UCSEM129', null, 11),
  ('2024', 3, 'GAMAT301', 'A', 1),
  ('2024', 3, 'PCCST302', 'B', 2),
  ('2024', 3, 'PCCST303', 'C', 3),
  ('2024', 3, 'PBCST304', 'D', 4),
  ('2024', 3, 'GAEST305', 'F', 5),
  ('2024', 3, 'UCHUT346', 'G', 6),
  ('2024', 3, 'UCHUT347', 'G', 7),
  ('2024', 3, 'PCCSL307', 'L', 8),
  ('2024', 3, 'PCCSL308', 'Q', 9),
  ('2024', 4, 'GAMAT401', 'A', 1),
  ('2024', 4, 'PCCST402', 'B', 2),
  ('2024', 4, 'PCCST403', 'C', 3),
  ('2024', 4, 'PBCST404', 'D', 4),
  ('2024', 4, 'PECST411', 'E', 5),
  ('2024', 4, 'PECST412', 'E', 6),
  ('2024', 4, 'PECST413', 'E', 7),
  ('2024', 4, 'PECST414', 'E', 8),
  ('2024', 4, 'PECST416', 'E', 9),
  ('2024', 4, 'PECST417', 'E', 10),
  ('2024', 4, 'PECST418', 'E', 11),
  ('2024', 4, 'PECST419', 'E', 12),
  ('2024', 4, 'PECST415', 'E', 13),
  ('2024', 4, 'PECST495', 'E', 14),
  ('2024', 4, 'UCHUT346', 'G', 15),
  ('2024', 4, 'UCHUT347', 'G', 16),
  ('2024', 4, 'PCCSL407', 'L', 17),
  ('2024', 4, 'PCCSL408', 'Q', 18),
  ('2024', 5, 'PCCST501', 'A', 1),
  ('2024', 5, 'PCCST502', 'B', 2),
  ('2024', 5, 'PCCST503', 'C', 3),
  ('2024', 5, 'PBCST504', 'D', 4),
  ('2024', 5, 'PECST521', 'E', 5),
  ('2024', 5, 'PECST522', 'E', 6),
  ('2024', 5, 'PECST523', 'E', 7),
  ('2024', 5, 'PECST524', 'E', 8),
  ('2024', 5, 'PECST526', 'E', 9),
  ('2024', 5, 'PECST527', 'E', 10),
  ('2024', 5, 'PECST528', 'E', 11),
  ('2024', 5, 'PECST525', 'E', 12),
  ('2024', 5, 'PECST595', 'E', 13),
  ('2024', 5, 'UCHUM506', 'I', 14),
  ('2024', 5, 'PCCSL507', 'L', 15),
  ('2024', 5, 'PCCSL508', 'Q', 16);

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
