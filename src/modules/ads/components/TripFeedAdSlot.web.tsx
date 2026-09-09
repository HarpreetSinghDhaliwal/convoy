// Web variant — Metro picks this file automatically when bundling for web,
// instead of TripFeedAdSlot.tsx (the native version below stays exactly
// the same for iOS/Android). react-native-google-mobile-ads is a
// native-only module; importing it on web crashes the entire bundle, not
// just this component, since Metro can't resolve its native component
// spec at all — that's a hard resolution failure, not a runtime warning.
// AdMob's own web SDK is a genuinely different product (Google Publisher
// Tags / AdSense for web) — out of scope until there's a real reason to
// monetize the web build specifically, so this renders nothing for now
// rather than half-implementing a second ad system.
export function TripFeedAdSlot() {
  return null;
}
