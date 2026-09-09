-- Migration 0020: Allow approved passengers to read broadcast announcements in group channel

drop policy if exists "trip members read undeleted messages" on public.messages;

create policy "trip members read undeleted messages"
  on public.messages for select
  using (
    deleted_at is null
    and (
      -- Direct 1-on-1 message participants (sender or recipient)
      sender_id = auth.uid()
      or recipient_id = auth.uid()
      -- Trip lead can view all trip communications
      or exists (select 1 from public.trips t where t.id = trip_id and t.lead_id = auth.uid())
      -- Approved trip members can read all trip group / broadcast announcements (recipient_id is null)
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
