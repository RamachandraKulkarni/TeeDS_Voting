-- Enable crypto helpers for uuid + hashing
create extension if not exists "pgcrypto";

-- Users table for OTP-authenticated voters/designers
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  asu_id text,
  discipline text,
  is_admin boolean default false,
  created_at timestamptz default timezone('utc', now())
);

alter table public.users add column if not exists full_name text;
alter table public.users add column if not exists asu_id text;
alter table public.users add column if not exists discipline text;

-- OTP storage (hashed, expiring)
create table if not exists public.otps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  otp_hash text not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default timezone('utc', now())
);
create index if not exists otps_email_idx on public.otps (email);

-- Design submissions
create table if not exists public.designs (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  storage_path text not null,
  modality text not null,
  student_name text,
  artwork_name text,
  major text,
  year_level text,
  asurite text,
  submitter_id uuid references public.users(id) on delete set null,
  submitter_hash text,
  submitted_at timestamptz default timezone('utc', now())
);
create index if not exists designs_modality_idx on public.designs (modality);

alter table public.designs add column if not exists student_name text;
alter table public.designs add column if not exists artwork_name text;
alter table public.designs add column if not exists major text;
alter table public.designs add column if not exists year_level text;
alter table public.designs add column if not exists asurite text;

-- Votes table
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references public.users(id) on delete cascade,
  design_id uuid references public.designs(id) on delete cascade,
  modality text not null,
  created_at timestamptz default timezone('utc', now())
);
create index if not exists votes_voter_idx on public.votes (voter_id, modality);
create unique index if not exists votes_unique_per_design on public.votes (voter_id, design_id);

-- Key/value settings table
create table if not exists public.settings (
  key text primary key,
  value text not null
);

-- Admin emails live here for quick bootstrap
create table if not exists public.admins (
  email text primary key
);

insert into public.settings (key, value) values
  ('votes_per_online', '1'),
  ('votes_per_in-person', '1'),
  ('votes_per_default', '1'),
  ('submitter_hash_secret', 'change-me')
on conflict (key) do nothing;

insert into public.admins (email) values
  ('rkulka43@asu.edu'),
  ('arobin13@asu.edu')
on conflict (email) do nothing;

-- Submitter hashing is now handled in the edge function; keep column for analytics only.
drop trigger if exists trg_designs_hash on public.designs;
drop function if exists public.populate_submitter_hash();

-- Voting RPC enforces per-modality limits
create or replace function public.cast_vote(p_voter_id uuid, p_design_id uuid, p_modality text)
returns public.votes
language plpgsql
security definer
set search_path = public
as $$
declare
  allowed integer;
  limit_key text := 'votes_per_' || lower(p_modality);
  inserted public.votes;
  used integer;
begin
  select coalesce(
      (select value::int from public.settings where key = limit_key),
      (select value::int from public.settings where key = 'votes_per_default'),
      1
    ) into allowed;

  select count(*) into used from public.votes where voter_id = p_voter_id and modality = p_modality;

  if used >= allowed then
    raise exception 'Vote limit reached for modality %', p_modality using errcode = 'P0001';
  end if;

  insert into public.votes (voter_id, design_id, modality)
    values (p_voter_id, p_design_id, p_modality)
    returning * into inserted;

  return inserted;
end;
$$;

grant execute on function public.cast_vote(uuid, uuid, text) to anon;

alter table public.designs enable row level security;
alter table public.votes enable row level security;

drop policy if exists designs_read on public.designs;
drop policy if exists designs_insert on public.designs;
drop policy if exists designs_insert_service_role on public.designs;
drop policy if exists designs_update on public.designs;
drop policy if exists designs_delete on public.designs;
drop policy if exists votes_read on public.votes;
drop policy if exists votes_insert on public.votes;

create policy designs_read on public.designs for select using (true);

create policy designs_insert on public.designs
  for insert to authenticated
  with check (auth.uid() = submitter_id);

create policy designs_insert_service_role on public.designs
  for insert to service_role
  with check (true);

create policy designs_update on public.designs
  for update to authenticated
  using (auth.uid() = submitter_id)
  with check (auth.uid() = submitter_id);

create policy designs_delete on public.designs
  for delete to authenticated
  using (auth.uid() = submitter_id);

create policy votes_read on public.votes for select using (true);

create policy votes_insert on public.votes
  for insert to authenticated
  with check (auth.uid() = voter_id);

comment on policy designs_insert on public.designs is 'Allow designers to upload their own work';
comment on policy votes_insert on public.votes is 'Each voter may insert their own vote rows via cast_vote RPC';
