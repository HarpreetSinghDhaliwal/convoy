# kyc

Government ID verification (HyperVerge or IDfy — see blueprint §08 for the
decision, not yet made) or DigiLocker document pull. Produces the Verified
badge; blocks trip creation/joining until passed. Driving license + vehicle
RC checks for Leads who drive.

**Blueprint refs:** §03 "Identity verification," §08 verification flow, §06 `users.kyc_status`/`kyc_doc_hash`.
**Depends on:** auth (session), profile (emergency contact — required before verification can start).
**Feeds:** trips (create/join gate), safety (ban tied to kyc_doc_hash, not account).

**Planned exports:** `KycUploadScreen`, `useKycStatus()`, `submitKyc()`,
`VerifiedBadge` component.
