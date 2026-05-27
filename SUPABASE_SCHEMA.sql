-- ============================================================
-- SMNHS SHS Enrollment — Supabase schema
-- Run this in your Supabase SQL editor:
--   https://supabase.com/dashboard/project/lhxrnobpgjmlcvcwexmx/sql
-- ============================================================

-- 1) Enrollments table
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  control_no bigserial unique,
  created_at timestamptz not null default now(),

  -- Learner
  last_name text, first_name text, middle_name text, extension_name text,
  lrn text, sex text, age int,
  nationality text, mother_tongue text,
  home_address text, contact_number text,
  date_of_birth date, place_of_birth text,
  religion text, ethnicity text,
  fourps text, facebook_name text,

  -- Parent/Guardian
  father_name text, father_occupation text, father_contact text,
  mother_name text, mother_occupation text, mother_contact text,
  guardian_name text, guardian_relationship text, guardian_contact text,

  -- Academic
  student_type text,
  previous_school text, previous_school_address text,
  previous_section text,
  status text, irregular_reason text,
  preferred_program text, track text, strand text,

  -- Health
  height_m numeric, weight_kg numeric, blood_type text,
  medical_conditions text,
  emergency_contact_person text, emergency_contact_number text,

  -- Documents
  doc_sf9 boolean default false, doc_psa boolean default false,
  doc_other boolean default false, other_documents text,
  doc_cor boolean default false, doc_a5 boolean default false,

  -- Certification & signatures (JSON stroke data — tiny, no images stored)
  learner_name text, guardian_signatory_name text,
  certified boolean default false,
  certified_at timestamptz,
  learner_signature_data jsonb,
  guardian_signature_data jsonb,

  -- Verification (set by admin in staff dashboard)
  is_verified boolean default false,
  verified_by_id uuid,
  verified_by_name text,
  verified_at timestamptz,

  -- Sectioning (filled by staff)
  assigned_section text
);

-- 2) Previous (Grade 11) sections — staff can extend the dropdown
create table if not exists public.previous_sections (
  name text primary key,
  created_at timestamptz not null default now()
);

-- 3) Grade 12 sections — created by staff for assignment
create table if not exists public.grade12_sections (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

-- 4) Verifiers - maintained by admin in Manage tab
create table if not exists public.verifiers (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Permissions (Supabase Data API)
-- App uses the anon key. Staff access is gated by passcode in app.
-- ============================================================
grant usage on schema public to anon, authenticated;

grant insert on public.enrollments to anon;
grant select, insert, update, delete on public.enrollments to authenticated;
grant all on public.enrollments to service_role;
grant usage, select on sequence public.enrollments_control_no_seq to anon, authenticated;

grant select, insert, delete on public.previous_sections to anon;
grant all on public.previous_sections to authenticated, service_role;

grant select, insert, delete on public.grade12_sections to anon;
grant all on public.grade12_sections to authenticated, service_role;

grant select, insert, delete on public.verifiers to anon;
grant all on public.verifiers to authenticated, service_role;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.enrollments enable row level security;
alter table public.previous_sections enable row level security;
alter table public.grade12_sections enable row level security;
alter table public.verifiers enable row level security;

-- Anyone can submit an enrollment (public form)
drop policy if exists "anyone can insert enrollment" on public.enrollments;
create policy "anyone can insert enrollment"
  on public.enrollments for insert to anon, authenticated with check (true);

-- Staff portal (passcode-gated client) reads/updates via anon key
drop policy if exists "staff read enrollments" on public.enrollments;
create policy "staff read enrollments"
  on public.enrollments for select to anon, authenticated using (true);

drop policy if exists "staff update enrollments" on public.enrollments;
create policy "staff update enrollments"
  on public.enrollments for update to anon, authenticated using (true) with check (true);

-- Sections are readable by all (form needs them), staff manage them
drop policy if exists "read previous sections" on public.previous_sections;
create policy "read previous sections"
  on public.previous_sections for select to anon, authenticated using (true);
drop policy if exists "manage previous sections" on public.previous_sections;
create policy "manage previous sections"
  on public.previous_sections for all to anon, authenticated using (true) with check (true);

drop policy if exists "read g12 sections" on public.grade12_sections;
create policy "read g12 sections"
  on public.grade12_sections for select to anon, authenticated using (true);
drop policy if exists "manage g12 sections" on public.grade12_sections;
create policy "manage g12 sections"
  on public.grade12_sections for all to anon, authenticated using (true) with check (true);

drop policy if exists "read verifiers" on public.verifiers;
create policy "read verifiers"
  on public.verifiers for select to anon, authenticated using (true);
drop policy if exists "manage verifiers" on public.verifiers;
create policy "manage verifiers"
  on public.verifiers for all to anon, authenticated using (true) with check (true);
