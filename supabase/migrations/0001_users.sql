-- Phase 00 foundation: the users table and its RLS policies.
-- Apply via the Supabase SQL editor or `supabase db push` once a project exists.

create type kyc_status as enum ('unverified', 'pending', 'verified', 'rejected');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  phone text not null,
  name text,
  photo_url text,
  dob date,
  kyc_status kyc_status not null default 'unverified',
  -- Hash, never the raw document — this is what a ban actually blocks
  -- against (blueprint §03: "a banned user can't simply re-register"), not
  -- a value any client or casual query should ever see in the clear.
  kyc_doc_hash text,
  emergency_contact jsonb,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Owner-only read/write. kyc_doc_hash and the full row are sensitive; other
-- users see a filtered view instead (profile module's concern, not this
-- migration's — see src/modules/profile/README.md).
create policy "users can read their own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users can update their own row"
  on public.users for update
  using (auth.uid() = id);

-- Row creation happens via a trigger on auth.users, not client-side insert —
-- keeps "a users row always exists once someone signs up" guaranteed at the
-- database level rather than depending on the app remembering to create one.
create function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, phone)
  values (new.id, coalesce(new.phone, ''));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
