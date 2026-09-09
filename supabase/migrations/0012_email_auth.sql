-- Auth pivot: email becomes the required login identity, replacing phone
-- OTP as primary. Direct reason: SMS costs money with every provider,
-- email OTP via a custom SMTP sender (Brevo, free tier) doesn't. Same
-- lesson already applied to KYC provider choice (§08) and payment framing
-- (§05) — free-first is the actual project constraint, not a one-off.
--
-- `phone` stays on the table (nullable now, was required) rather than
-- being dropped — it's still useful for emergency_contact-style future
-- features, just no longer what login runs on. Not a destructive change.

alter table public.users
  add column email text,
  alter column phone drop not null;

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, phone, email)
  values (new.id, new.phone, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- One user should be findable by email for the notification-matching
-- trigger (0013) without a sequential scan.
create index users_email_idx on public.users(email);
