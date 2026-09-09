# safety

The priority module (blueprint §03): SOS button with live location + 112
swipe-to-call, mandatory emergency contact enforcement, report/block on any
user or content, ban list tied to `kyc_doc_hash` (not just account), listing
content moderation (images + links), Grievance Officer page + SLA tracking.

**Blueprint refs:** §03 (whole section), §05 legal (Grievance Officer), §06 `reports` table.
**Depends on:** kyc (ban enforcement), profile (emergency contact).
**Feeds:** chat, trips (report/block wired into both).

**Planned exports:** `SosButton`, `ReportDialog`, `useEmergencyContact()`,
`blockUser()`, `GrievanceOfficerScreen`.
