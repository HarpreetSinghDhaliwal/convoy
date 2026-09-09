# Architecture

Companion to the [Convoy Blueprint](https://claude.ai/code/artifact/3aeff8e4-24cb-4490-9fb7-b313b432b8b5) and [Build Checklist](https://claude.ai/code/artifact/d9b19453-a860-4ebd-95bd-d5aeee2489e6) — this file is about *how the code is organized*, not what gets built.

## The module boundary

Everything domain-specific lives under `src/modules/<name>/`, one folder per
area from the blueprint:

```
src/modules/<name>/
  index.ts        ← the ONLY thing other modules or app/ routes may import
  README.md       ← scope, blueprint section refs, dependencies, planned exports
  screens/        ← full-screen components
  components/     ← module-internal UI pieces (not shared across modules)
  hooks/          ← module-internal React hooks
  services/       ← Supabase queries/mutations for this module's tables
  types.ts        ← this module's domain types
```

**The rule that makes this expandable:** never import from another module's
internals (`@/modules/trips/services/tripService`) — only from its `index.ts`
(`@/modules/trips`). A module can be reworked internally without anything
outside it breaking, and it's obvious from `index.ts` alone what a module
actually exposes.

Current modules — **14, all built**, not scaffolded (12 original + `legal` +
`notifications`, added the same way as real requirements surfaced):

| Module | Status | Blueprint §§ |
|---|---|---|
| `auth` | **Email** OTP (not phone — SMS costs money, Brevo SMTP is free), session hook, sign out | §00 |
| `profile` | `EmergencyContactScreen`, `PhoneRequiredScreen`, `PublicProfileScreen`, `ProfileSummary`, `ContactPhoneReveal` (server-enforced trip-contextual phone visibility) | §03, §06 |
| `kyc` | DigiLocker decided as provider; manual-review stub stands in until Partner Org registration is approved | §03, §08 |
| `trips` | create/browse/search/join/approve/decline/cancel, KYC- and ratings-gated (client + RLS), best-effort requester-location capture for §05 | §01, §06, §10 Phase 01 |
| `pickup-points` | `PickupPointManager` (map-based, plus "suggest from requesters" clustering), `PickupPointSelector` | §01, §06, §10 Phase 01/05 |
| `routing` | MapLibre (OpenFreeMap tiles) + Nominatim geocoding + OSRM routing, `MapPicker`, `OverlappingTripsList` | §07, §06, §10 Phase 01/05 |
| `chat` | realtime trip chat, contact/payment-info **blocked outright** (not just flagged), two-stage retention as real `pg_cron` jobs | §03, §04, §06 |
| `safety` | report/block, `ReportDialog`, `BlockButton`, `SosButton` (location + native share sheet, not a paid SMS gateway), `bans` table keyed by `kyc_doc_hash` | §03, §05, §06 |
| `ratings` | mandatory two-sided post-trip ratings, DB-enforced pending-ratings gate on trip create/join | §03, §06, §10 Phase 03 |
| `follows` | `FollowButton`, gated at the DB layer by `can_follow()` (shared completed trip only) | §01, §03, §06, §10 Phase 03 |
| `notifications` | favorite destinations (curated list, geocoded for real — not scraped) + the email pipeline that alerts favoriters when a nearby trip publishes | not in blueprint — added on request |
| `ads` | `TripFeedAdSlot` (AdMob banner, Google test IDs until a real account exists), `initializeAds()` in root layout | §09, §10 Phase 04 |
| `legal` | ToS, Privacy Policy, Grievance Officer page (drafts, pending real legal review), granular consent screen gating `(app)` | §04, §05, §10 Phase 00 |

## Phone number handling — a real, server-enforced rule, not a UI convention

Phone is **required** at onboarding but **never OTP-verified** (email does
that job now). It is **never** exposed through `public_profiles` or any
general read path. The only way to see another user's number is the
`get_trip_contact_phone` RPC (migration 0014), which enforces:

- The trip's **Lead sees any requester's phone at any status** — vetting
  who's asking is what that visibility is for.
- A **requester sees nobody's phone — not even the Lead's — until their own
  membership is approved**, at which point they see the Lead's and every
  other approved member's.

This is enforced in Postgres, not by a screen choosing not to render a
field — a modified client or direct API call can't see more than the rule
allows either.

## Shared content-safety logic

`src/lib/contentSafety/contactInfoDetector.ts` — moved here from being
chat-only once trips/ratings needed the same check. Two different
enforcement levels, deliberately: chat (members-only, post-approval) flags
and blocks sending; public content — trip descriptions/notes (visible to
anyone browsing, no trust relationship yet) — blocks at submission,
stricter because the exposure is broader and indiscriminate.

## What's still genuinely open — and why each one is a real, not a laziness, gap

- **Real DigiLocker OAuth** — blocked on Partner Organization registration
  via API Setu, an approval process, not an instant key.
- **Real AdMob ad units** — needs an actual AdMob account + app
  registration; runs on Google's published test IDs until then.
- **A named Grievance Officer** — needs a real person's name and contact
  from you; not something to fabricate into a legal compliance page.
- **Brevo SMTP configured in Supabase Auth's dashboard settings**, and a
  **Brevo API key + verified sender set as Edge Function secrets** — both
  need your Brevo account, can't be done from here.
- **Migrations 0012–0014 not yet applied** — see README. 0001–0011 are
  confirmed live (verified directly against the REST API, not assumed).
- **The `send-notification-email` Edge Function isn't deployed** — the code
  is written and excluded from this project's lint/typecheck scope (it's
  Deno, a different runtime), but deploying it needs the Supabase CLI
  logged in, which this environment doesn't have.

## Everything else

- **`src/app/`** — Expo Router routes. Files here should be thin: import a
  screen from a module, render it. Route protection (auth/consent/phone
  gating) lives in `src/app/_layout.tsx` via `Stack.Protected`, the current
  Expo Router pattern for this SDK version — not a manual redirect.
- **`src/lib/`** — cross-cutting infrastructure no single module owns:
  Supabase client, env config, content-safety detection. Modules depend on
  `lib/`, never the reverse.
- **`src/theme/`** — colors, spacing, typography tokens. Same palette as the
  Blueprint/Checklist artifacts, so the docs and the app read as one product.
- **`src/components/`** — shared, dumb UI (`Button`, `TextField`, `Screen`).
  If a component needs domain knowledge, it belongs in a module instead.
- **`supabase/migrations/`** — 14 files, 0001 through 0014. 0001–0011
  confirmed applied and live; 0012–0014 (email auth, phone visibility,
  notifications) are new this round, not yet applied.
- **`supabase/functions/`** — `send-notification-email`, a Deno Edge
  Function, not deployed yet.

## Stack

React Native + Expo (SDK 57), Expo Router (file-based, `Stack.Protected` for
auth/consent/phone gating), Supabase (Postgres + PostGIS + Auth + Realtime +
Storage + pg_cron + pg_net + Edge Functions), MapLibre (OpenFreeMap tiles —
free, no key, no limits) + Nominatim + OSRM for maps/routing (deliberately
not Google, see blueprint §07), AdMob for ads, Brevo for all outbound email
(SMTP for Auth's built-in emails, API for app-triggered notifications).
