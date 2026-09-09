-- Phone number visibility rules (not just a client-side convention — phone
-- is sensitive PII, protected at the data layer the same way everything
-- else sensitive is in this project):
--
-- - The trip's Lead can always see the phone of anyone who has requested
--   to join, at any status — vetting who's asking is exactly what that
--   visibility is for.
-- - A requester sees nobody's phone until THEIR OWN membership is
--   approved — "booking done" — at which point they can see the Lead's
--   phone and every other approved member's phone (they're now confirmed
--   to be traveling together).
-- - Before approval, a requester sees no one's phone, including the Lead's.

create or replace function public.get_trip_contact_phone(p_trip_id uuid, p_target_user_id uuid)
returns text as $$
declare
  requester_status trip_member_status;
  is_lead boolean;
  target_is_lead boolean;
begin
  select (lead_id = auth.uid()) into is_lead from public.trips where id = p_trip_id;
  select (lead_id = p_target_user_id) into target_is_lead from public.trips where id = p_trip_id;

  -- Lead can see any requester's phone, any status.
  if is_lead then
    return (select phone from public.users where id = p_target_user_id);
  end if;

  -- Everyone else needs their own membership approved first.
  select status into requester_status
  from public.trip_members
  where trip_id = p_trip_id and user_id = auth.uid();

  if requester_status = 'approved' then
    -- Can see the Lead's phone, or any other approved member's phone.
    if target_is_lead then
      return (select phone from public.users where id = p_target_user_id);
    end if;

    if exists (
      select 1 from public.trip_members
      where trip_id = p_trip_id and user_id = p_target_user_id and status = 'approved'
    ) then
      return (select phone from public.users where id = p_target_user_id);
    end if;
  end if;

  return null;
end;
$$ language plpgsql security definer stable;
