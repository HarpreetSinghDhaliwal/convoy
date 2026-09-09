-- Phase 17: Support multi-seat booking in trip_members and chat listing enhancements

alter table public.trip_members
  add column if not exists seats_requested int not null default 1 check (seats_requested > 0);

-- Allow reading messages list for trips user is approved on or leads
create or replace view public.my_active_chats as
select
  t.id as trip_id,
  t.destination,
  t.origin_label,
  t.depart_at,
  t.lead_id,
  u.name as lead_name,
  u.photo_url as lead_photo_url
from public.trips t
join public.users u on u.id = t.lead_id
where t.cancelled_at is null;
