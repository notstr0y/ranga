-- ============================================================================
-- RANGA 002 — Permissions, developer role and Row Level Security (idempotent)
-- Depends on: 001_schema.sql
--
-- Model
--   * anon / authenticated can READ the catalogue and PUBLISHED resources.
--   * A "developer" is a Supabase Auth user whose id is listed in public.app_developers.
--     That table is invisible to the API; membership is checked by the SECURITY DEFINER function
--     public.is_developer(), which is what every write policy uses. There is no client-side flag.
--   * Developers may write the catalogue and update/delete resource rows through the API (RLS enforced).
--     Developers cannot INSERT resources through the API: uploads go through the `developer-resources`
--     Edge Function, which validates the PDF, writes to private storage and inserts with the service role.
--   * Everyone else has no write access whatsoever.
--
-- ADD A DEVELOPER (SQL editor, run as project owner — see README "Developer access"):
--   insert into public.app_developers (user_id, note)
--   select id, 'owner' from auth.users where email = 'you@example.com';
-- ============================================================================

-- ---------- developer allowlist ----------
create table if not exists public.app_developers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  note text,
  created_at timestamptz not null default now()
);
alter table public.app_developers enable row level security;     -- no policies: unreachable through the API
revoke all on public.app_developers from anon, authenticated;

create or replace function public.is_developer()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.app_developers d where d.user_id = auth.uid())
$$;
revoke all on function public.is_developer() from public;
grant execute on function public.is_developer() to anon, authenticated;

-- ---------- RLS on ----------
alter table public.programmes enable row level security;
alter table public.schemes    enable row level security;
alter table public.semesters  enable row level security;
alter table public.subjects   enable row level security;
alter table public.courses    enable row level security;
alter table public.resources  enable row level security;

-- ---------- public read policies ----------
drop policy if exists "Public can read programmes" on public.programmes;
create policy "Public can read programmes" on public.programmes for select to anon, authenticated using (true);
drop policy if exists "Public can read schemes" on public.schemes;
create policy "Public can read schemes" on public.schemes for select to anon, authenticated using (true);
drop policy if exists "Public can read semesters" on public.semesters;
create policy "Public can read semesters" on public.semesters for select to anon, authenticated using (true);
drop policy if exists "Public can read subjects" on public.subjects;
create policy "Public can read subjects" on public.subjects for select to anon, authenticated using (true);
drop policy if exists "Public can read courses" on public.courses;
create policy "Public can read courses" on public.courses for select to anon, authenticated using (true);
drop policy if exists "Public can read published resources" on public.resources;
create policy "Public can read published resources" on public.resources for select to anon, authenticated
  using (status = 'published');

-- ---------- developer write policies ----------
drop policy if exists "Developers manage programmes" on public.programmes;
create policy "Developers manage programmes" on public.programmes for all to authenticated
  using (public.is_developer()) with check (public.is_developer());
drop policy if exists "Developers manage schemes" on public.schemes;
create policy "Developers manage schemes" on public.schemes for all to authenticated
  using (public.is_developer()) with check (public.is_developer());
drop policy if exists "Developers manage semesters" on public.semesters;
create policy "Developers manage semesters" on public.semesters for all to authenticated
  using (public.is_developer()) with check (public.is_developer());
drop policy if exists "Developers manage subjects" on public.subjects;
create policy "Developers manage subjects" on public.subjects for all to authenticated
  using (public.is_developer()) with check (public.is_developer());
drop policy if exists "Developers manage courses" on public.courses;
create policy "Developers manage courses" on public.courses for all to authenticated
  using (public.is_developer()) with check (public.is_developer());

drop policy if exists "Developers read all resources" on public.resources;
create policy "Developers read all resources" on public.resources for select to authenticated
  using (public.is_developer());
drop policy if exists "Developers update resources" on public.resources;
create policy "Developers update resources" on public.resources for update to authenticated
  using (public.is_developer()) with check (public.is_developer());
drop policy if exists "Developers delete resources" on public.resources;
create policy "Developers delete resources" on public.resources for delete to authenticated
  using (public.is_developer());

-- ---------- table privileges ----------
-- Start from nothing, then grant back. RLS above decides WHO may use each privilege.
revoke insert, update, delete, truncate on
  public.programmes, public.schemes, public.semesters, public.subjects, public.courses, public.resources
from anon, authenticated;

grant select on public.programmes, public.schemes, public.semesters, public.subjects, public.courses
  to anon, authenticated;
grant insert, update, delete on public.programmes, public.schemes, public.semesters, public.subjects, public.courses
  to authenticated;                                    -- usable only by developers (policies)

-- resources: expose everything EXCEPT file_key and sha256 (storage internals) via column grants.
revoke select on public.resources from anon, authenticated;
grant select (id, subject_id, title, description, resource_type, academic_year, exam_session,
              exam_type, file_name, file_size_bytes, mime_type, external_url, status, metadata,
              created_at, updated_at, published_at)
  on public.resources to anon, authenticated;
-- developers may edit descriptive fields and status; storage columns can only change via the Edge Function
grant update (title, description, resource_type, academic_year, exam_session, exam_type, status, published_at)
  on public.resources to authenticated;
grant delete on public.resources to authenticated;      -- row only; the Edge Function also removes the stored file
