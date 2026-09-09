-- Phase 03: follow, earned by traveling together (blueprint §01, §03). The
-- constraint below is the actual enforcement — not just a UI convention —
-- an open follow-anyone graph on a platform doing women-only trips and
-- stranger meetups is a real harassment/stalking vector.

create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.users(id),
  followed_id uuid not null references public.users(id),
  via_trip_id uuid not null references public.trips(id),
  created_at timestamptz not null default now(),
  unique (follower_id, followed_id)
);

alter table public.follows enable row level security;

create policy "follows are readable by the follower and the followed"
  on public.follows for select
  using (follower_id = auth.uid() or followed_id = auth.uid());

-- The real gate: via_trip_id must reference a trip where BOTH the follower
-- and the person being followed were confirmed participants (Lead or
-- approved member), and the trip has actually happened. This runs at the
-- database layer, not just checked client-side before an insert.
create or replace function public.can_follow(
  p_follower uuid,
  p_followed uuid,
  p_trip_id uuid
) returns boolean as $$
  select exists (
    select 1 from public.trips t
    where t.id = p_trip_id
      and t.depart_at < now()
      and (t.lead_id = p_follower or exists (
        select 1 from public.trip_members tm
        where tm.trip_id = t.id and tm.user_id = p_follower and tm.status = 'approved'
      ))
      and (t.lead_id = p_followed or exists (
        select 1 from public.trip_members tm
        where tm.trip_id = t.id and tm.user_id = p_followed and tm.status = 'approved'
      ))
  );
$$ language sql security definer stable;

create policy "follow only with a shared completed trip"
  on public.follows for insert
  with check (
    follower_id = auth.uid()
    and public.can_follow(follower_id, followed_id, via_trip_id)
  );

create policy "users unfollow their own follows"
  on public.follows for delete
  using (follower_id = auth.uid());
