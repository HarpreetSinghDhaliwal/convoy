-- Phase 03: ratings (blueprint §03 "Reputation"). Public read — the whole
-- point of a reputation system is other people can see it before deciding
-- to travel with someone.

create table public.ratings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id),
  rater_id uuid not null references public.users(id),
  ratee_id uuid not null references public.users(id),
  score int not null check (score between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  unique (trip_id, rater_id, ratee_id)
);

alter table public.ratings enable row level security;

create policy "ratings are publicly readable"
  on public.ratings for select
  using (true);

create policy "users rate as themselves"
  on public.ratings for insert
  with check (rater_id = auth.uid());

-- The gate: "block new trip creation/join until pending ratings are
-- submitted" (checklist) needs to know what's outstanding. Lead → rates
-- every approved member; member → rates the Lead and every other approved
-- member. Only counts trips that have actually departed.
create or replace function public.get_pending_ratings(p_user_id uuid)
returns table(trip_id uuid, ratee_id uuid) as $$
  with my_trips as (
    select t.id as trip_id, t.lead_id, true as i_am_lead
    from public.trips t
    where t.lead_id = p_user_id and t.depart_at < now()
    union
    select t.id as trip_id, t.lead_id, false as i_am_lead
    from public.trips t
    join public.trip_members tm on tm.trip_id = t.id
    where tm.user_id = p_user_id and tm.status = 'approved' and t.depart_at < now()
  ),
  counterparts as (
    select mt.trip_id, tm.user_id as ratee_id
    from my_trips mt
    join public.trip_members tm on tm.trip_id = mt.trip_id and tm.status = 'approved'
    where mt.i_am_lead
    union
    select mt.trip_id, mt.lead_id as ratee_id
    from my_trips mt
    where not mt.i_am_lead
    union
    select mt.trip_id, tm.user_id as ratee_id
    from my_trips mt
    join public.trip_members tm on tm.trip_id = mt.trip_id and tm.status = 'approved'
    where not mt.i_am_lead and tm.user_id <> p_user_id
  )
  select c.trip_id, c.ratee_id
  from counterparts c
  where not exists (
    select 1 from public.ratings r
    where r.trip_id = c.trip_id and r.rater_id = p_user_id and r.ratee_id = c.ratee_id
  );
$$ language sql security definer stable;
