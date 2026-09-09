-- Public-safe profile view. The `users` table's RLS (0001) only lets a user
-- read their own row — correct for phone/kyc_doc_hash/emergency_contact,
-- wrong for name/photo/Verified badge, which need to be visible to other
-- users (trip listings, incoming requests, following list). Fixed with a
-- VIEW projecting only safe columns, not by loosening the base table's RLS
-- — RLS is row-level, not column-level, so a looser policy on `users`
-- itself would expose phone numbers and KYC hashes along with the name.
--
-- Views run with their owner's privileges by default in Postgres (no
-- `security_invoker`), so this legitimately bypasses `users`' restrictive
-- RLS for exactly the columns exposed here — the standard, documented
-- pattern for this exact problem, not a workaround.

create view public.public_profiles as
select id, name, photo_url, kyc_status
from public.users;

grant select on public.public_profiles to authenticated;
