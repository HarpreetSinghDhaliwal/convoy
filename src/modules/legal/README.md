# legal

Terms of Service, Privacy Policy, Grievance Officer page, and granular
consent capture. Added as its own module (not in the original 11) because
the Build Checklist treats "Legal" as a distinct Phase 00 group — the module
set expands as real requirements surface, not just from a fixed list decided
on day one.

**Blueprint refs:** §04 (DPDP obligations), §05 (legal framing), §10 Phase 00.
**Depends on:** auth (session, for recording consent).
**Gates:** the whole `(app)` group — root layout requires `consent_complete`
alongside a session, same as it requires the session itself.

**Important:** the ToS/Privacy Policy text in this module is a working draft
reflecting the blueprint's decisions (platform-as-coordinator framing,
cost-sharing language, DPDP data lifecycle) — not a substitute for review by
an actual lawyer before this goes live. Flagged in-code, not just here.

**Planned exports:** `ConsentScreen`, `TermsOfServiceScreen`,
`PrivacyPolicyScreen`, `GrievanceOfficerScreen`, `useConsentStatus()`,
`recordConsent()`.
