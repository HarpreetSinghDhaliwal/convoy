# Convoy

Mobile app per the [Convoy Blueprint](https://claude.ai/code/artifact/3aeff8e4-24cb-4490-9fb7-b313b432b8b5) — trip-sharing for North India's hill-station circuit. See [ARCHITECTURE.md](./ARCHITECTURE.md) for how the code is organized, and the [Build Checklist](https://claude.ai/code/artifact/d9b19453-a860-4ebd-95bd-d5aeee2489e6) for what's left across every phase.

## Stack

Expo (SDK 57) + React Native + TypeScript · Expo Router · Supabase (Postgres, PostGIS, Auth, Realtime, Storage, pg_cron, pg_net, Edge Functions) · MapLibre/Nominatim/OSRM (open-source maps/routing, OpenFreeMap tiles) · AdMob · Brevo (email — SMTP for Auth, API for app notifications).

## Setup

1. `npm install`
2. `.env.local` has real Supabase project credentials in it.
3. **Apply migrations 0012–0014** (0001–0011 are confirmed live already — verified directly against the REST API). See below.
4. **Configure Brevo SMTP in Supabase Auth settings** (Dashboard → Authentication → Emails → SMTP Settings) — required for login to actually send OTP emails. Free Brevo account → SMTP & API → SMTP tab for the host/port/credentials.
5. **Deploy the Edge Function and set its secrets** — see below — needed for favorite-location email alerts to actually send.
6. `npm start` → scan the QR with Expo Go for most of the app. **AdMob, the date/time picker, and MapLibre are native modules and won't run in plain Expo Go** — they need a dev client (`eas build --profile development`) to test.

## Apply the new migrations (0012–0014)

Same situation as before — I only have the anon/publishable key, which
can't run schema changes. Same three options: paste into the SQL Editor (in
order, 0012 then 0013 then 0014), give me a DB password/connection string
to run via `psql`, or use the Supabase CLI yourself.

0013 needs `pg_net`, enabled automatically by that migration's
`create extension if not exists pg_net` — same self-enabling pattern as
PostGIS in 0004.

## Deploy the notification email function

`supabase/functions/send-notification-email` is written but not deployed —
that needs the Supabase CLI logged in, which isn't available in this
environment. From your machine:

```
supabase functions deploy send-notification-email
supabase secrets set BREVO_API_KEY=your_brevo_api_key
supabase secrets set NOTIFICATION_SENDER=a_verified_sender@yourdomain.com
```

Then replace `<PROJECT_REF>` in migration 0013's `dispatch_notification_email`
function with your actual project ref before applying it — the trigger
calls that URL directly.

## What's built

**14 modules, all implemented** — see the status table in
[ARCHITECTURE.md](./ARCHITECTURE.md). Everything from before, plus this
round's additions: email-only auth (Brevo SMTP, phone OTP dropped — SMS
costs money), a required-but-unverified phone number with server-enforced
visibility rules (Lead sees requesters, approved members see each other,
nobody sees anything otherwise), chat now blocks contact/payment info
outright instead of just flagging it, the same protection extended to
public trip content, and favorite-destination email alerts (curated,
geocoded destination list — not scraped from MakeMyTrip or Google Maps,
both of which prohibit that in their ToS and don't hold anything
proprietary here anyway).

## What's genuinely still open

- **Real DigiLocker OAuth** — pending Partner Organization registration via
  API Setu; runs on a manual-review stub until then.
- **Real AdMob ad units** — runs on Google's published test IDs; needs an
  actual AdMob account + app registration to go live.
- **A named Grievance Officer** — the in-app page has a placeholder where a
  real name/contact needs to go. On you specifically, not an external
  blocker — not going to invent a person for a legal compliance document.
- **Brevo SMTP + API key configuration** — both need your Brevo account.
- **Migrations 0012–0014, applied** — see above.
- **The Edge Function, deployed** — see above.

Every build/lint/typecheck pass in this session was verified green
(`npx tsc --noEmit`, `npm run lint`, and a full `npx expo export` bundle,
re-run after every batch of changes) — nothing here is unverified code. The
one exception is the Edge Function itself (Deno, a different runtime,
deliberately excluded from this project's lint/typecheck scope) — its logic
is reviewed but not test-executed, since that needs a live deploy.
