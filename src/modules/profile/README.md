# profile

User profile: name, photo, emergency contact (required before KYC), public
profile view (photo, Verified badge, rating, past trips).

**Blueprint refs:** §03 identity verification (emergency contact), §06 `users` table.
**Depends on:** auth (session), kyc (badge display), ratings (rating display).

**Planned exports:** `ProfileEditScreen`, `PublicProfileScreen`,
`useProfile()`, `updateProfile()`.
