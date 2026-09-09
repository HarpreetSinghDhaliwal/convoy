import { View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { spacing } from "@/theme";

// No real AdMob account exists yet — same category of external dependency
// as the DigiLocker Partner Org registration. Falls back to Google's
// published test ad unit ID (safe to ship, never real revenue) until
// EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID is set; swapping to a real one is a
// single env var, not a code change. Native module — this can't run inside
// plain Expo Go, needs a dev client build (`eas build --profile development`).
const unitId = process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID || TestIds.BANNER;

export function TripFeedAdSlot() {
  return (
    <View style={{ alignItems: "center", marginVertical: spacing.md }}>
      <BannerAd unitId={unitId} size={BannerAdSize.MEDIUM_RECTANGLE} />
    </View>
  );
}
