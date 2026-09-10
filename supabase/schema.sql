-- ============================================================
-- STEM VAULT — Supabase Schema
-- Run this in your Supabase SQL editor
-- ============================================================

-- Profiles table linked to auth.users
-- NOTE: display_name has a UNIQUE constraint to prevent duplicate handles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text unique,
  role text default 'user' check (role in ('user', 'verified', 'admin')),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Stems directory table
-- NOTE: status defaults to 'pending' — admin must approve before appearing in feed
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
  status text default 'pending' check (status in ('pending', 'published', 'flagged')),
  download_count integer default 0,
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

-- Users can see their own stems regardless of status (for profile page)
create policy "Users view own stems"
  on public.stems for select using (auth.uid() = user_id);

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

-- ------------------------------------------------------------
-- Community Ratings, Comments & Mix Showcase
-- ------------------------------------------------------------

-- 1. Stem Ratings Table
create table if not exists public.stem_ratings (
  id uuid primary key default gen_random_uuid(),
  stem_id uuid references public.stems(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (stem_id, user_id)
);

-- 2. Stem Comments Table
create table if not exists public.stem_comments (
  id uuid primary key default gen_random_uuid(),
  stem_id uuid references public.stems(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_handle text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Community Mixes Showcase Table
create table if not exists public.stem_mixes (
  id uuid primary key default gen_random_uuid(),
  stem_id uuid references public.stems(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  user_handle text not null,
  title text not null,
  mix_url text not null,
  description text,
  likes_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Mix Likes Table
create table if not exists public.mix_likes (
  id uuid primary key default gen_random_uuid(),
  mix_id uuid references public.stem_mixes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (mix_id, user_id)
);

-- Enable RLS and public policies
alter table public.stem_ratings enable row level security;
alter table public.stem_comments enable row level security;
alter table public.stem_mixes enable row level security;
alter table public.mix_likes enable row level security;

create policy "Public read stem_ratings" on public.stem_ratings for select using (true);
create policy "Authenticated insert stem_ratings" on public.stem_ratings for insert with check (auth.role() = 'authenticated');
create policy "Authenticated update stem_ratings" on public.stem_ratings for update using (auth.uid() = user_id);

create policy "Public read stem_comments" on public.stem_comments for select using (true);
create policy "Authenticated insert stem_comments" on public.stem_comments for insert with check (auth.role() = 'authenticated');
-- Users can delete their own comments
create policy "Users delete own comments" on public.stem_comments for delete using (auth.uid() = user_id);
-- Admins can delete any comment
create policy "Admins delete any comment" on public.stem_comments for delete using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

create policy "Public read stem_mixes" on public.stem_mixes for select using (true);
create policy "Authenticated insert stem_mixes" on public.stem_mixes for insert with check (auth.role() = 'authenticated');

create policy "Public read mix_likes" on public.mix_likes for select using (true);
create policy "Authenticated insert mix_likes" on public.mix_likes for insert with check (auth.role() = 'authenticated');
create policy "Authenticated delete mix_likes" on public.mix_likes for delete using (auth.uid() = user_id);

-- ============================================================
-- MIGRATION SNIPPETS: Run these on an existing database
-- ============================================================
-- alter table public.stems add column if not exists download_count integer default 0;
-- alter table public.stems add column if not exists tags text[] default array[]::text[];
-- alter table public.stems alter column status set default 'pending';
-- alter table public.profiles add constraint profiles_display_name_unique unique (display_name);
-- alter table public.stems add policy "Users view own stems" on public.stems for select using (auth.uid() = user_id);

