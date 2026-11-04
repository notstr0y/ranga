# RANGA — v2.0.0 (V1 scope: CSE)

A centralized academic-resources library for students of **APJ Abdul Kalam Technological University (KTU)** —
question papers, notes, study materials and lab resources, organised programme → scheme → semester → subject.

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · Supabase (Postgres, Auth, Edge Functions) · BookMyHost S3 storage · PWA.

## What V1 is
V1 focuses **only on Computer Science and Engineering (CSE)**: the **2019** and **2024** schemes. The catalogue is deliberately
small and checked rather than broad and guessed. Coverage today: CSE 2019 S1–S2, CSE 2024 S1–S5 (all eight semester records exist for both
schemes). See [`docs/CATALOGUE.md`](docs/CATALOGUE.md) for sources, counts and what is still unverified — notably **CSE 2019 S3–S8 are not seeded yet**.

Resource categories: **Question Papers, Notes, Study Materials, Lab Resources, Other** (PDF files). **Year** is a question-paper field:
required for Question Papers (form, filter, listing and database rule) and absent for every other category.
There is no Documents section; the journey is Home → CSE → Scheme → Semester → Subject → Category → Resource → PDF.

**Community contributions are not enabled.** The app shows the announcement “Community contributions open from 4 November 2026.”, but there is no
public upload or moderation workflow in this release. Enabling it safely needs: authenticated student accounts (or a captcha-protected form), a
separate `submissions` table and **separate private bucket/prefix**, a size/type-checking Edge Function like `developer-resources`, a moderation queue
that only developers can approve, and RLS so a submission is never readable publicly until approved. Until then, only developers upload.

## Run it
```bash
npm install
cp .env.example .env.local     # fill in placeholders; never commit this file
npm run dev                    # http://localhost:5173
npm run build && npm run preview
npm run lint && npx tsc -b && npm test && npm run test:upload
```
Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` reach the browser. Everything else in `.env.example` is for admin scripts / Edge Function secrets and must never be prefixed `VITE_`.
The release label (`RELEASE @ v2.0.0`, bottom of the home screen) is read from `package.json` at build time — bump the version there only.

## 1. Database setup (Supabase SQL editor, in order)
| Order | File | Purpose |
|---|---|---|
| 0 (optional) | `000_preflight_inspect.sql` | Read-only look at the current database. |
| 1 | `001_schema.sql` | Idempotent schema changes: five categories, year rule, search columns. Never drops tables. |
| 2 | `002_permissions_and_rls.sql` | Public read of catalogue + **published** resources; `app_developers` allowlist; `is_developer()`; developer write policies; column grants hiding storage keys. |
| 3 | `003_academic_catalogue.sql` | **Generated.** CSE programme, 2019/2024 schemes, 8 semesters each, verified subjects. Upsert only — deletes nothing. |
| 4 | `004_search_and_indexes.sql` | Catalogue view, search functions (code with/without spaces, name, title, session, year), indexes. |
| 5 | `005_v1_cleanup.sql` | **DESTRUCTIVE.** Run PART A (read-only preview) first. Removes non-CSE programmes/schemes/semesters/subjects, retires assignment/YouTube/external types, removes retired CSE-2024 codes. Resources are never deleted: those on non-CSE subjects are detached + archived; link-only resources are archived and become `other`; files in storage are untouched. |
| 6 | `006_validate_catalogue.sql` | Read-only checks (duplicates, semester coverage, unverified entries, resource rules). |

**Supabase CLI alternative:** `supabase/migrations/20261104090000_v1_cse_scope_developer_workspace.sql` is 001 + 002 + 004 concatenated (`npm run migration:build` regenerates it). Use `supabase db push` for it, then run 003, 005, 006 in the SQL editor — seeding and destructive cleanup are manual on purpose. Don't run both routes; they do the same thing and are both idempotent.
`npm run catalogue:build` regenerates 003/005/006 from `supabase/catalogue/data.mjs`.
All scripts were exercised against a local PostgreSQL (legacy database → new scripts; fresh database → CLI migration; re-runs; RLS as anon / student / developer). They have **not** been run against your Supabase project.

## 2. Developer access (secure)
1. Supabase → **Authentication → Users → Add user** (email + password). Disable public sign-ups under *Authentication → Providers → Email* so no one else can create accounts.
2. In the SQL editor, allow-list that user (the table has no API access):
   `insert into public.app_developers (user_id, note) select id, 'owner' from auth.users where email = 'you@example.com';`
3. Open `/developer` on the site and sign in. The **Developer workspace** button then also appears in the top-bar account panel (only for allow-listed users).
Authorisation is entirely server-side: `public.is_developer()` backs every write policy, and the upload Edge Function re-checks the allowlist with the service role. Being signed in is not enough; there is no frontend flag, hidden route secret, or hard-coded email.

## 3. Storage and Edge Functions (private BookMyHost bucket)
The bucket stays **private**. The browser never sees S3 credentials; PDFs are served through short-lived signed URLs from `resource-url`, and uploads go through `developer-resources`.
```bash
npx supabase link --project-ref <your-ref>
npx supabase secrets set S3_ENDPOINT=https://YOUR-ENDPOINT S3_REGION=us-east-1 S3_BUCKET=YOUR-BUCKET \
     S3_ACCESS_KEY_ID=YOUR-KEY S3_SECRET_ACCESS_KEY=YOUR-SECRET ALLOWED_ORIGINS=https://your-domain.example
npx supabase functions deploy resource-url
npx supabase functions deploy developer-resources
```
`developer-resources`: verified user JWT → allowlist check → 25 MB limit → real `%PDF-` signature check → duplicate check by SHA-256 → server-generated key `resources/<subject-id>/<random-uuid>.pdf` → store → insert row; if the insert fails the stored object is deleted again. Retrying an identical file returns the existing record. Resources created this way are published immediately.

## 4. Developer workspace (`/developer`)
Tabs: **Overview** (counts, subjects needing review), **Catalogue** (programmes → schemes → semesters → subjects: add, edit, delete with confirmation, “create missing S1–S8”), **Upload**, **Resources** (publish / archive / delete).
* **Add a programme / scheme / semester / subject:** Catalogue tab, top-down. Scheme codes are years (`2024`); subject codes are exactly as printed by KTU; duplicates are rejected by the database. A subject whose code already exists must reuse its exact official name.
* **Upload a PDF:** Upload tab → programme → scheme → semester → subject → category → title → (Question Papers only: **year**, optional session and exam type) → choose PDF → *Upload and publish*. You get an explicit success or failure message.
* **Question-paper year:** required and validated (2000 … next year) in the form, the Edge Function and the database (`resources_pyq_requires_year`). For other categories the year is neither shown nor stored, even if sent.
* CLI alternative (service role, your machine only): `npm run resource:add -- ./paper.pdf --programme CSE --scheme 2024 --semester 4 --subject PCCST402 --type pyq --year 2024 --title "…" --publish`.

## 5. App behaviour notes
* **Welcome screen:** shown once per browser *session* (`sessionStorage`), never auto-dismissed — it waits for **Enter** / a tap / Esc. Navigation or a refresh in the same tab does not bring it back; a fresh session (new tab/app launch) does. No replay control exists.
* **Offline screen:** `ranga-offline-v2` artwork (uploaded as `Eda_Mone_Net_Poya_Error_Screen.png`, 1536×1024, stored losslessly as WebP, pixel-identical), pure black background, shown uncropped. A real button sits over the artwork's drawn “Try Again” and calls a genuine reachability check (`/ping.txt`, never cached); the app also re-checks every 10 s and recovers by itself.
* **Empty states:** the line *“Da mone, Rangan Chettan kaanikkum ennu paranja kaanikkum!”* appears only on a subject page whose subject (or selected category) genuinely has zero resources — not while loading, not on errors, not for a year filter with no matches.
* **Announcement + developer credit:** top-bar account panel; homepage carries a compact headline. Copy and the developer credit live in `src/lib/announcement.ts` (the repository had no developer credit before V1; set the real one there).
* **PWA:** unchanged — precached app shell, update prompt, PDFs and API calls never cached.

## Adding another programme later (e.g. AIML, ECE, ME)
Developer workspace → Catalogue → add the programme, add its schemes, **Create missing** semesters, then add subjects (or extend `supabase/catalogue/data.mjs` and rebuild 003). Nothing else in the app is hard-wired to CSE; the Home/Browse screens list whatever programmes exist. Future expansion (more programmes, schemes, community submissions) is documented here and intentionally not announced in the app UI.

## Project layout
```
src/pages/          Home, Browse, Subject, Search, Resource, developer/ (lazy-loaded workspace)
src/components/     ui/ layout/ academic/ resources/ search/ brand/
src/hooks/ lib/     data hooks, Supabase client + API, developer API, announcement copy
supabase/           manual-sql/ (001–006), catalogue/data.mjs, functions/{resource-url,developer-resources}, migrations/
scripts/            catalogue + migration builders, admin CLI (service role)
docs/CATALOGUE.md   sources, counts, unverified entries
```
## Security notes
`.env*` (except `.env.example`) is git-ignored. The service-role key and S3 secrets exist only in Edge Function secrets and your local admin environment. RLS lets the public read the catalogue and **published** resources only; storage keys and hashes are not readable through the API; only allow-listed developers can write.

## License
To be decided.
