export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

// Fixed reasons, not a free-text-only field — makes reports scannable in a
// review queue and lets patterns (e.g. a user with five "unsafe driving"
// reports) actually surface instead of being buried in prose.
export const REPORT_REASONS = [
  "Harassment or inappropriate behavior",
  "Unsafe driving",
  "Scam or payment request outside the app",
  "Fake or misleading listing",
  "No-show",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export interface Report {
  id: string;
  tripId: string | null;
  reporterId: string;
  reportedId: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  createdAt: string;
}
