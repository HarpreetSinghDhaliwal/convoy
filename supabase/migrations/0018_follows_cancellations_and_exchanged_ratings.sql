-- Migration 0018: Public Follows, Trip Cancellations with Review Note, and Double-Blind Exchanged Ratings

-- 1. Relax follows table to allow standard public following while preserving optional via_trip_id
alter table public.follows alter column via_trip_id drop not null;

drop policy if exists "follows are readable by the follower and the followed" on public.follows;
create policy "follows are publicly readable"
  on public.follows for select
  using (true);

drop policy if exists "follow only with a shared completed trip" on public.follows;
create policy "authenticated users can follow"
  on public.follows for insert
  with check (follower_id = auth.uid());

drop policy if exists "users unfollow their own follows" on public.follows;
create policy "users can unfollow"
  on public.follows for delete
  using (follower_id = auth.uid());

-- 2. Cancellations with mandatory note and review queue
create table if not exists public.trip_cancellations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id),
  user_id uuid not null references public.users(id),
  role text not null check (role in ('lead', 'passenger')),
  reason_category text not null,
  reason_note text not null,
  status text not null default 'pending_review' check (status in ('pending_review', 'reviewed', 'flagged')),
  cancelled_at timestamptz not null default now()
);

alter table public.trip_cancellations enable row level security;

create policy "cancellations are readable by all authenticated users"
  on public.trip_cancellations for select
  using (true);

create policy "users can log their own cancellations"
  on public.trip_cancellations for insert
  with check (user_id = auth.uid());

-- 3. Exchanged Ratings: Only show ratings publicly when both parties have rated each other (double-blind)
create or replace view public.public_exchanged_ratings as
select
  r.id,
  r.trip_id,
  r.rater_id,
  r.ratee_id,
  r.score,
  r.review,
  r.created_at,
  u.name as rater_name,
  u.photo_url as rater_photo_url,
  true as is_exchanged
from public.ratings r
join public.users u on u.id = r.rater_id
where exists (
  select 1 from public.ratings r2
  where r2.trip_id = r.trip_id
    and r2.rater_id = r.ratee_id
    and r2.ratee_id = r.rater_id
)
or r.created_at < (now() - interval '14 days');
