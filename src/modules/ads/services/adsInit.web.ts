// Web variant — Metro picks this over adsInit.ts automatically when
// bundling for web. This file must NOT import react-native-google-mobile-ads
// at all, even though the native adsInit.ts only calls it inside a function:
// Metro resolves static imports into the bundle graph at build time,
// regardless of whether the runtime ever executes the code path — so the
// mere `import MobileAds from "react-native-google-mobile-ads"` line in the
// native file is enough to pull in its native-only codegen spec and crash
// the entire web bundle, even from a route as unrelated as the root layout.
export async function initializeAds(): Promise<void> {
  // No-op on web — no AdMob web SDK wired up (see TripFeedAdSlot.web.tsx).
}
