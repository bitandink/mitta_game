-- Mitta Halloween: passenger persistence schema (run in existing Supabase SQL Editor)
-- Server-side service-role API only; no direct anonymous client table access.
create extension if not exists pgcrypto;

create table if not exists public.game_passengers (
  id uuid primary key default gen_random_uuid(),
  nickname text not null check (char_length(btrim(nickname)) between 1 and 12),
  character text not null check (char_length(character) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_progress (
  passenger_id uuid primary key references public.game_passengers(id) on delete cascade,
  completed_stages text[] not null default '{}'::text[],
  rune_puzzle jsonb not null,
  revision bigint not null default 0 check (revision >= 0),
  saved_at timestamptz not null default now(),
  constraint valid_completed_stages check (
    completed_stages <@ array['candy','cave','potion','treat','shelter','cake','hut','broom','kitchen','hat','ghost','forest','moon']::text[]
  ),
  constraint rune_puzzle_shape check (
    jsonb_typeof(rune_puzzle) = 'object' and
    jsonb_typeof(rune_puzzle->'answer') = 'array' and
    jsonb_typeof(rune_puzzle->'choices') = 'array'
  )
);

create table if not exists public.passenger_credentials (
  passenger_id uuid primary key references public.game_passengers(id) on delete cascade,
  recovery_hash text not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);

create index if not exists game_passengers_nickname_idx on public.game_passengers (lower(nickname));

alter table public.game_passengers enable row level security;
alter table public.game_progress enable row level security;
alter table public.passenger_credentials enable row level security;

-- No policies: anon/authenticated have no direct table access.
-- Also revoke table privileges explicitly. Service-role API bypasses RLS.
revoke all on table public.game_passengers, public.game_progress, public.passenger_credentials from anon, authenticated;
