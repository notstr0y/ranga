-- RANGA: Initial database schema

create extension if not exists pgcrypto;

-- Academic programmes
create table public.programmes (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    name text not null,
    degree text not null default 'B.Tech',
    created_at timestamptz not null default now()
);

-- Academic schemes
create table public.schemes (
    id uuid primary key default gen_random_uuid(),
    programme_id uuid not null references public.programmes(id),
    code text not null,
    name text not null,
    created_at timestamptz not null default now(),
    unique (programme_id, code)
);

-- Semesters
create table public.semesters (
    id uuid primary key default gen_random_uuid(),
    scheme_id uuid not null references public.schemes(id),
    semester_number smallint not null check (semester_number between 1 and 8),
    name text not null,
    unique (scheme_id, semester_number)
);

-- Subjects
create table public.subjects (
    id uuid primary key default gen_random_uuid(),
    semester_id uuid not null references public.semesters(id),
    code text not null,
    name text not null,
    created_at timestamptz not null default now(),
    unique (semester_id, code)
);

-- Academic resources
create table public.resources (
    id uuid primary key default gen_random_uuid(),
    subject_id uuid references public.subjects(id),
    title text not null,
    description text,

    resource_type text not null check (
        resource_type in ('pyq', 'notes', 'lab', 'youtube', 'other')
    ),

    academic_year integer,
    exam_session text,

    -- BookMyHost object key, NOT a public URL
    file_key text,
    external_url text,

    status text not null default 'draft' check (
        status in ('draft', 'published', 'archived')
    ),

    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    check (
        (file_key is not null and external_url is null)
        or
        (file_key is null and external_url is not null)
    )
);

-- Indexes for common browsing operations
create index idx_schemes_programme
    on public.schemes(programme_id);

create index idx_semesters_scheme
    on public.semesters(scheme_id);

create index idx_subjects_semester
    on public.subjects(semester_id);

create index idx_resources_subject
    on public.resources(subject_id);

create index idx_resources_type_status
    on public.resources(resource_type, status);

create index idx_resources_created
    on public.resources(created_at desc);

-- Enable Row Level Security
alter table public.programmes enable row level security;
alter table public.schemes enable row level security;
alter table public.semesters enable row level security;
alter table public.subjects enable row level security;
alter table public.resources enable row level security;

-- Public users can read academic information
create policy "Public can read programmes"
on public.programmes for select
to anon, authenticated
using (true);

create policy "Public can read schemes"
on public.schemes for select
to anon, authenticated
using (true);

create policy "Public can read semesters"
on public.semesters for select
to anon, authenticated
using (true);

create policy "Public can read subjects"
on public.subjects for select
to anon, authenticated
using (true);

-- Public users can only read published resources
create policy "Public can read published resources"
on public.resources for select
to anon, authenticated
using (status = 'published');

-- No public insert, update or delete policies.
