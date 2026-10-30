-- ============================================================
-- MIXING VAULT v1 - BETA MIGRATION
-- Tables: multis, multi_tracks, mixes, plugin_chains, plugin_chain_items
-- ============================================================

-- 1. multis
create table if not exists public.multis (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_multis_owner_id on public.multis(owner_id);
create index if not exists idx_multis_created_at on public.multis(created_at desc);

-- 2. multi_tracks
create table if not exists public.multi_tracks (
  id uuid primary key default gen_random_uuid(),
  multi_id uuid not null references public.multis(id) on delete cascade,
  stored_filename text not null,
  original_filename text not null,
  format text not null,
  size_bytes bigint not null,
  r2_key text not null,
  public_url text not null,
  duration_seconds numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_multi_tracks_multi_id on public.multi_tracks(multi_id);

-- 3. mixes
create table if not exists public.mixes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  multi_id uuid references public.multis(id) on delete set null,
  title text not null,
  format text not null,
  size_bytes bigint not null,
  r2_key text not null,
  public_url text not null,
  duration_seconds numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_mixes_owner_id on public.mixes(owner_id);
create index if not exists idx_mixes_multi_id on public.mixes(multi_id);
create index if not exists idx_mixes_created_at on public.mixes(created_at desc);

-- 4. plugin_chains
create table if not exists public.plugin_chains (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  daw text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_plugin_chains_owner_id on public.plugin_chains(owner_id);
create index if not exists idx_plugin_chains_created_at on public.plugin_chains(created_at desc);

-- 5. plugin_chain_items
create table if not exists public.plugin_chain_items (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.plugin_chains(id) on delete cascade,
  position integer not null,
  plugin_name text not null,
  vendor text,
  category text,
  notes text
);

create index if not exists idx_plugin_chain_items_chain_id on public.plugin_chain_items(chain_id);
create index if not exists idx_plugin_chain_items_position on public.plugin_chain_items(chain_id, position);

-- Enable Row Level Security (RLS)
alter table public.multis enable row level security;
alter table public.multi_tracks enable row level security;
alter table public.mixes enable row level security;
alter table public.plugin_chains enable row level security;
alter table public.plugin_chain_items enable row level security;

-- Policies for multis
create policy "Public read multis" on public.multis for select using (true);
create policy "Authenticated insert multis" on public.multis for insert with check (auth.uid() = owner_id);
create policy "Owners update multis" on public.multis for update using (auth.uid() = owner_id);
create policy "Owners delete multis" on public.multis for delete using (
  auth.uid() = owner_id or exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Policies for multi_tracks
create policy "Public read multi_tracks" on public.multi_tracks for select using (true);
create policy "Owners insert multi_tracks" on public.multi_tracks for insert with check (
  exists (select 1 from public.multis where multis.id = multi_tracks.multi_id and multis.owner_id = auth.uid())
);
create policy "Owners delete multi_tracks" on public.multi_tracks for delete using (
  exists (
    select 1 from public.multis where multis.id = multi_tracks.multi_id and (
      multis.owner_id = auth.uid() or exists (
        select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'
      )
    )
  )
);

-- Policies for mixes
create policy "Public read mixes" on public.mixes for select using (true);
create policy "Authenticated insert mixes" on public.mixes for insert with check (auth.uid() = owner_id);
create policy "Owners update mixes" on public.mixes for update using (auth.uid() = owner_id);
create policy "Owners delete mixes" on public.mixes for delete using (
  auth.uid() = owner_id or exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Policies for plugin_chains
create policy "Public read plugin_chains" on public.plugin_chains for select using (true);
create policy "Authenticated insert plugin_chains" on public.plugin_chains for insert with check (auth.uid() = owner_id);
create policy "Owners update plugin_chains" on public.plugin_chains for update using (auth.uid() = owner_id);
create policy "Owners delete plugin_chains" on public.plugin_chains for delete using (
  auth.uid() = owner_id or exists (
    select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Policies for plugin_chain_items
create policy "Public read plugin_chain_items" on public.plugin_chain_items for select using (true);
create policy "Owners insert plugin_chain_items" on public.plugin_chain_items for insert with check (
  exists (select 1 from public.plugin_chains where plugin_chains.id = plugin_chain_items.chain_id and plugin_chains.owner_id = auth.uid())
);
create policy "Owners update plugin_chain_items" on public.plugin_chain_items for update using (
  exists (select 1 from public.plugin_chains where plugin_chains.id = plugin_chain_items.chain_id and plugin_chains.owner_id = auth.uid())
);
create policy "Owners delete plugin_chain_items" on public.plugin_chain_items for delete using (
  exists (
    select 1 from public.plugin_chains where plugin_chains.id = plugin_chain_items.chain_id and (
      plugin_chains.owner_id = auth.uid() or exists (
        select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'
      )
    )
  )
);

-- Permissions for local PostgREST / roles
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
