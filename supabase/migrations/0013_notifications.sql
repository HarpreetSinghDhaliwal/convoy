-- Email notifications + favorite locations. "Follow a destination, get
-- emailed when someone plans a trip there" — a different kind of follow
-- from the person-to-person one in 0008: no shared-trip gate, since
-- favoriting a place isn't a safety-relevant action the way following a
-- person is.
--
-- Pipeline: favorite_locations (what a user watches) → a trigger on trips
-- becoming published matches against them within radius_km using PostGIS →
-- matches land in notification_queue → a second trigger fires an async
-- HTTP call (pg_net) to an Edge Function, which actually sends the email
-- via Brevo. Queue table exists so "did we mean to notify this person" is
-- inspectable and retriable independent of whether the send succeeded.

create table public.favorite_locations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  label text not null,
  lat numeric not null,
  lng numeric not null,
  radius_km numeric not null default 50,
  created_at timestamptz not null default now()
);

alter table public.favorite_locations enable row level security;

create policy "users manage their own favorite locations"
  on public.favorite_locations for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create type notification_status as enum ('pending', 'sent', 'failed');

create table public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null,
  subject text not null,
  body text not null,
  status notification_status not null default 'pending',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- No client-facing policies at all — RLS enabled with zero policies locks
-- this to the service role, same pattern as `bans` (0002). Nobody should
-- read anyone else's pending notification emails.
alter table public.notification_queue enable row level security;

-- Fires when a trip is newly published. Matches against every favorite
-- location within its radius_km of the trip's destination point, using the
-- geography distance built for Phase 05's route matching (0009) — same
-- ST_DWithin pattern, applied to a point instead of a route.
create or replace function public.notify_matching_favorites()
returns trigger as $$
declare
  fav record;
  lead_email text;
begin
  if new.published = true and (old is null or old.published = false) then
    select email into lead_email from public.users where id = new.lead_id;

    for fav in
      select fl.*, u.email as favoriter_email
      from public.favorite_locations fl
      join public.users u on u.id = fl.user_id
      where u.email is not null
        and fl.user_id <> new.lead_id
        and ST_DWithin(
          -- ST_MakePoint takes (longitude, latitude), i.e. (x, y) — not
          -- (lat, lng). Both points below are lng-first on purpose.
          ST_SetSRID(ST_MakePoint(fl.lng, fl.lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(new.destination_lng, new.destination_lat), 4326)::geography,
          fl.radius_km * 1000
        )
    loop
      insert into public.notification_queue (recipient_email, subject, body)
      values (
        fav.favoriter_email,
        'A new trip to ' || new.destination || ' was just planned',
        'Someone published a trip to ' || new.destination ||
          ', near your favorited "' || fav.label || '" (departing ' ||
          to_char(new.depart_at, 'DD Mon YYYY, HH24:MI') || '). Open Convoy to see it.'
      );
    end loop;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_trip_published_notify_favorites
  after insert or update on public.trips
  for each row execute function public.notify_matching_favorites();

-- Async HTTP dispatch on queue insert. pg_net is Supabase's extension for
-- exactly this — a non-blocking HTTP call from inside a trigger, pointed
-- at this project's own send-notification-email Edge Function (URL filled
-- in from EXPO_PUBLIC_SUPABASE_URL in .env.local — this only needs
-- revisiting if the project is ever migrated to a different Supabase
-- project).
create extension if not exists pg_net;

create or replace function public.dispatch_notification_email()
returns trigger as $$
begin
  perform net.http_post(
    url := 'https://akxxbulhmmnsydeznkxi.supabase.co/functions/v1/send-notification-email',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('notification_id', new.id)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_notification_queued_dispatch
  after insert on public.notification_queue
  for each row execute function public.dispatch_notification_email();
