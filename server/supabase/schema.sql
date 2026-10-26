-- Run this in the Supabase SQL editor. Create the private bucket in Storage first:
-- name: project-references, public: false
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120), reference_image_path text, analysis jsonb,
  generated_code text not null default '', current_code text not null default '',
  design_settings jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade, version_number integer not null, code text not null,
  generated_code text not null default '', analysis jsonb, design_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), unique (project_id, version_number)
);
create index if not exists projects_user_updated_idx on public.projects (user_id, updated_at desc);
create index if not exists project_versions_project_idx on public.project_versions (project_id, version_number desc);
alter table public.projects enable row level security;
alter table public.project_versions enable row level security;
create policy "Users manage only their projects" on public.projects for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage only their project versions" on public.project_versions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id and exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
-- Storage RLS for private reference screenshots. Paths are <user-id>/<project-id>/<filename>.
