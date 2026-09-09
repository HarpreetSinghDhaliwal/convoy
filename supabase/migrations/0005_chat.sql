-- Phase 02: trip-scoped chat (blueprint §03 "Chat safety", §04 data
-- lifecycle). Two-stage retention lives here as real scheduled jobs, not
-- just a policy written down: soft-delete from the app 2 weeks post-trip,
-- hard-delete from the restricted store 90 days post-trip.

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  sender_id uuid not null references public.users(id),
  body text not null,
  flagged boolean not null default false,
  sent_at timestamptz not null default now(),
  -- Soft-delete marker for the 2-week UI cutoff. Rows past this are still
  -- in the table (the 90-day legal-hold copy IS this table, RLS-filtered —
  -- not a separate physical store) until the hard-delete job removes them.
  deleted_at timestamptz
);

alter table public.messages enable row level security;

-- Only the Lead or an *approved* member can read/send — chat opens on
-- approval, not on request (blueprint §01). Soft-deleted rows are excluded
-- from this policy entirely; only the service role (bypassing RLS) can see
-- them, which is the "restricted, access-controlled" part of the 90-day
-- window in practice.
create policy "trip members read undeleted messages"
  on public.messages for select
  using (
    deleted_at is null
    and (
      exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid())
      or exists (
        select 1 from public.trip_members
        where trip_members.trip_id = messages.trip_id
          and trip_members.user_id = auth.uid()
          and trip_members.status = 'approved'
      )
    )
  );

create policy "trip members send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (
      exists (select 1 from public.trips where trips.id = trip_id and trips.lead_id = auth.uid())
      or exists (
        select 1 from public.trip_members
        where trip_members.trip_id = messages.trip_id
          and trip_members.user_id = auth.uid()
          and trip_members.status = 'approved'
      )
    )
  );

-- Realtime needs this table publishing changes, or chat isn't actually live.
alter publication supabase_realtime add table public.messages;

-- Two-stage retention as real scheduled jobs (requires pg_cron, available
-- on Supabase — enable it in the dashboard's Database > Extensions if this
-- errors on a fresh project).
create extension if not exists pg_cron;

create or replace function public.soft_delete_old_trip_chats()
returns void as $$
  update public.messages
  set deleted_at = now()
  where deleted_at is null
    and trip_id in (
      select id from public.trips where depart_at < now() - interval '14 days'
    );
$$ language sql security definer;

create or replace function public.hard_delete_old_trip_chats()
returns void as $$
  delete from public.messages
  where trip_id in (
    select id from public.trips where depart_at < now() - interval '90 days'
  );
$$ language sql security definer;

select cron.schedule('soft-delete-trip-chats', '0 3 * * *', 'select public.soft_delete_old_trip_chats();');
select cron.schedule('hard-delete-trip-chats', '0 4 * * *', 'select public.hard_delete_old_trip_chats();');
