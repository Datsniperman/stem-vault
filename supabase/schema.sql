-- ============================================================
-- STEM VAULT — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  role text default 'user' check (role in ('user', 'verified', 'admin')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Stems directory table
create table if not exists public.stems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  title text not null,
  artist text not null,
  bpm integer check (bpm >= 30 and bpm <= 300),
  key text,
  track_count integer check (track_count >= 1 and track_count <= 128),
  format text not null,
  host_platform text not null,
  download_url text not null,
  uploader_handle text not null,
  tags text[] default array[]::text[],
  is_verified boolean default false,
  status text default 'published' check (status in ('pending', 'published', 'flagged')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.stems enable row level security;

-- Profile policies
create policy "Public viewable profiles"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Admins update all profiles"
  on public.profiles for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Stem policies
create policy "Public viewable stems"
  on public.stems for select using (status = 'published');

create policy "Authenticated submit stems"
  on public.stems for insert with check (auth.role() = 'authenticated');

create policy "Owners update own stems"
  on public.stems for update using (auth.uid() = user_id);

create policy "Admins full control"
  on public.stems for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
