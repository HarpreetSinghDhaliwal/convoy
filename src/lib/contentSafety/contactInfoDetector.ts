// Shared across modules (chat, trips, ratings) — moved here from chat's
// internals once trips/ratings needed the same check, since this is
// exactly the kind of cross-cutting logic src/lib/ exists for
// (ARCHITECTURE.md: "infrastructure no single module owns").
//
// Flags text that looks like an attempt to move contact or payment off
// platform (blueprint §03's anti-scam control, adapted from BlaBlaCar's
// version). Two call sites use this differently, deliberately:
// - Chat (post-approval, members-only): warn and flag for review, still
//   sends — occasional legitimate reasons exist once trust is established.
// - Public content — trip descriptions, ratings reviews (visible to
//   anyone browsing, before any trust relationship exists): block
//   submission outright. Broader, indiscriminate exposure deserves a
//   stricter response than a members-only chat does.

const PHONE_RE = /(\+?\d[\s-]?){9,13}/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const URL_RE = /(https?:\/\/|www\.)\S+/i;
const SOLICITATION_RE = /\b(whatsapp|telegram|insta(gram)?|pay\s?me|upi\s?id|gpay|paytm)\b/i;

export function looksLikeContactOrPaymentInfo(text: string): boolean {
  return PHONE_RE.test(text) || EMAIL_RE.test(text) || URL_RE.test(text) || SOLICITATION_RE.test(text);
}
