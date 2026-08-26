-- Speak60 — family multi-user schema.
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: uses "if not exists" / "or replace" everywhere.

-- ============================================================
-- 1. Profiles — one row per family member, keyed to their auth user.
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Speaker',
  is_admin boolean not null default false,
  challenge_start_date date,
  custom_filler_words text[] not null default '{}',
  privacy_acknowledged boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Change this to whichever email should automatically be the family admin.
-- Anyone can be promoted later via: update public.profiles set is_admin = true where id = '<user-uuid>';
create or replace function public.is_admin_user(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select is_admin from public.profiles where id = uid), false);
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, display_name, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    (lower(new.email) = 'siddharth.jain605@gmail.com')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent a user from granting themselves admin via a client-side update.
create or replace function public.protect_admin_flag()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    new.is_admin = old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_admin_flag_trigger on public.profiles;
create trigger protect_admin_flag_trigger
  before update on public.profiles
  for each row execute function public.protect_admin_flag();

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin_user(auth.uid()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ============================================================
-- 2. Attempts — every Daily Challenge / Practice recording's data (not audio).
-- ============================================================
create table if not exists public.attempts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  is_daily_challenge boolean not null,
  day integer,
  date date not null,
  topic_id text not null,
  topic_text text not null,
  topic_category text not null,
  topic_difficulty integer not null,
  scratchpad text not null default '',
  prep_start timestamptz,
  prep_end timestamptz,
  speech_start timestamptz,
  speech_end timestamptz,
  transcript_raw text not null default '',
  transcript_segments jsonb not null default '[]',
  metrics jsonb,
  scores jsonb,
  coach jsonb,
  has_audio boolean not null default false,
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.attempts enable row level security;

drop policy if exists "attempts_select" on public.attempts;
create policy "attempts_select" on public.attempts
  for select using (auth.uid() = user_id or public.is_admin_user(auth.uid()));

drop policy if exists "attempts_insert" on public.attempts;
create policy "attempts_insert" on public.attempts
  for insert with check (auth.uid() = user_id);

drop policy if exists "attempts_update" on public.attempts;
create policy "attempts_update" on public.attempts
  for update using (auth.uid() = user_id);

drop policy if exists "attempts_delete" on public.attempts;
create policy "attempts_delete" on public.attempts
  for delete using (auth.uid() = user_id);

create index if not exists attempts_user_id_idx on public.attempts (user_id);

-- ============================================================
-- 3. Topic usage — per-user "already used" tracking for the no-repeat pool.
-- ============================================================
create table if not exists public.topic_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null,
  last_used_date date,
  times_used integer not null default 0,
  primary key (user_id, topic_id)
);

alter table public.topic_usage enable row level security;

drop policy if exists "topic_usage_all_own" on public.topic_usage;
create policy "topic_usage_all_own" on public.topic_usage
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- 4. Topic settings — shared active/inactive flag, admin-controlled.
-- ============================================================
create table if not exists public.topic_settings (
  topic_id text primary key,
  active boolean not null default true
);

alter table public.topic_settings enable row level security;

drop policy if exists "topic_settings_select" on public.topic_settings;
create policy "topic_settings_select" on public.topic_settings
  for select using (auth.role() = 'authenticated');

drop policy if exists "topic_settings_write" on public.topic_settings;
create policy "topic_settings_write" on public.topic_settings
  for all using (public.is_admin_user(auth.uid())) with check (public.is_admin_user(auth.uid()));

-- ============================================================
-- 5. Custom topics — anyone in the family can add; only admin/author can edit.
-- ============================================================
create table if not exists public.custom_topics (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users (id) on delete set null,
  text text not null,
  category text not null,
  subcategory text not null default 'General',
  difficulty integer not null default 2,
  type text not null default 'opinion',
  created_at timestamptz not null default now()
);

alter table public.custom_topics enable row level security;

drop policy if exists "custom_topics_select" on public.custom_topics;
create policy "custom_topics_select" on public.custom_topics
  for select using (auth.role() = 'authenticated');

drop policy if exists "custom_topics_insert" on public.custom_topics;
create policy "custom_topics_insert" on public.custom_topics
  for insert with check (auth.uid() = created_by);

drop policy if exists "custom_topics_modify" on public.custom_topics;
create policy "custom_topics_modify" on public.custom_topics
  for update using (auth.uid() = created_by or public.is_admin_user(auth.uid()));

drop policy if exists "custom_topics_delete" on public.custom_topics;
create policy "custom_topics_delete" on public.custom_topics
  for delete using (auth.uid() = created_by or public.is_admin_user(auth.uid()));

-- ============================================================
-- 6. Badges
-- ============================================================
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  name text not null,
  description text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

alter table public.badges enable row level security;

drop policy if exists "badges_select" on public.badges;
create policy "badges_select" on public.badges
  for select using (auth.uid() = user_id or public.is_admin_user(auth.uid()));

drop policy if exists "badges_insert" on public.badges;
create policy "badges_insert" on public.badges
  for insert with check (auth.uid() = user_id);
