import MobileAds from "react-native-google-mobile-ads";

let initialized = false;

// Must run once before any BannerAd will actually load. Root layout calls
// this on mount — nowhere else needs to know it exists.
export async function initializeAds(): Promise<void> {
  if (initialized) return;
  await MobileAds().initialize();
  initialized = true;
}
