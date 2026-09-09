-- Safety & reporting infra (blueprint §03, §06). Built ahead of chat/trips
-- shipping (checklist: "build now even though those ship later") so the
-- report pipeline exists before there's anything to report on.

create type report_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  -- Nullable: a report can be about a profile with no trip context, not
  -- just trip-scoped content.
  trip_id uuid,
  reporter_id uuid not null references public.users(id),
  reported_id uuid not null references public.users(id),
  reason text not null,
  detail text,
  status report_status not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.reports enable row level security;

-- Reporter can file and read their own reports. Deliberately no policy lets
-- reported_id read reports about themselves — that's a retaliation vector.
-- Review happens via the service role (Supabase Studio's table editor is a
-- genuinely adequate, zero-cost moderation queue at this scale — a bespoke
-- admin dashboard is a later build, not a Phase 00 blocker).
create policy "reporters can file reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reporters can read their own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

create table public.blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.users(id),
  blocked_id uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);

alter table public.blocks enable row level security;

create policy "users manage their own blocklist"
  on public.blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

-- Ban list keyed by document hash, not account (blueprint §03: "a banned
-- user can't simply re-register"). No client-facing policies at all — RLS
-- enabled with zero policies locks this to the service role exclusively,
-- which is exactly right for a table this sensitive.
create table public.bans (
  id uuid primary key default gen_random_uuid(),
  kyc_doc_hash text not null unique,
  reason text not null,
  banned_at timestamptz not null default now()
);

alter table public.bans enable row level security;

create function public.is_doc_hash_banned(hash text)
returns boolean as $$
  select exists(select 1 from public.bans where kyc_doc_hash = hash);
$$ language sql security definer stable;
