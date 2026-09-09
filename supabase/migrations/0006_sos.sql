-- SOS events (blueprint §03 "In-trip safety"). A real audit log of every
-- trigger, not just a UI action — needed for the "health-check/monitoring
-- on the SOS feature itself" checklist item (Ola/Uber have both had public
-- SOS-button failures; this table is what makes "did it actually fire"
-- checkable after the fact).

create table public.sos_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id),
  trip_id uuid references public.trips(id),
  lat numeric not null,
  lng numeric not null,
  triggered_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.sos_events enable row level security;

create policy "users create their own SOS events"
  on public.sos_events for insert
  with check (user_id = auth.uid());

create policy "users read their own SOS events"
  on public.sos_events for select
  using (user_id = auth.uid());

create policy "users resolve their own SOS events"
  on public.sos_events for update
  using (user_id = auth.uid());
