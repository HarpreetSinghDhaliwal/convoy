-- Migration 0019: 1-on-1 Direct Host-Passenger Chats and Trip Planner Group Chat Permission

-- 1. Add group_chat_enabled flag to trips (default false: 1-on-1 chats only)
alter table public.trips add column if not exists group_chat_enabled boolean not null default false;

-- 2. Add recipient_id to messages to support direct 1-on-1 private messaging
alter table public.messages add column if not exists recipient_id uuid references public.users(id);

-- 3. Update policies for message access control
drop policy if exists "trip members read undeleted messages" on public.messages;
create policy "trip members read undeleted messages"
  on public.messages for select
  using (
    deleted_at is null
    and (
      -- Direct message participants
      sender_id = auth.uid()
      or recipient_id = auth.uid()
      -- Trip lead can view trip communications
      or exists (select 1 from public.trips t where t.id = trip_id and t.lead_id = auth.uid())
      -- Group/broadcast messages readable by all approved members
      or (
        recipient_id is null
        and exists (
          select 1 from public.trip_members tm
          where tm.trip_id = messages.trip_id
            and tm.user_id = auth.uid()
            and tm.status = 'approved'
        )
      )
    )
  );

drop policy if exists "trip members send messages" on public.messages;
create policy "trip members send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and (
      -- Lead can send 1-on-1 to approved member or group message
      exists (select 1 from public.trips t where t.id = trip_id and t.lead_id = auth.uid())
      -- Approved member can send 1-on-1 to host, or group message if group chat is enabled
      or exists (
        select 1 from public.trips t
        join public.trip_members tm on tm.trip_id = t.id
        where t.id = messages.trip_id
          and tm.user_id = auth.uid()
          and tm.status = 'approved'
          and (
            recipient_id = t.lead_id
            or (recipient_id is null and t.group_chat_enabled = true)
          )
      )
    )
  );
