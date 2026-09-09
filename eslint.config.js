// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    // Deno runtime (Supabase Edge Functions) — a different environment
    // with its own globals/imports, not this Expo project's lint scope.
    ignores: ["dist/**", "supabase/functions/**"],
  },
];
