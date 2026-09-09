-- Granular consent (blueprint §04 DPDP obligations: "separate consents, not
-- one bundled checkbox"). Timestamps, not booleans — an auditable record of
-- when consent was given, not just whether.

alter table public.users
  add column consent_kyc_at timestamptz,
  add column consent_location_at timestamptz,
  add column consent_chat_at timestamptz;

-- A single "has this user completed onboarding consent" check is used
-- constantly (every app load, in the root layout's routing guard) — a
-- generated column means that check is a single indexed boolean read, not
-- three timestamp comparisons repeated everywhere it's needed.
alter table public.users
  add column consent_complete boolean generated always as (
    consent_kyc_at is not null
    and consent_location_at is not null
    and consent_chat_at is not null
  ) stored;
