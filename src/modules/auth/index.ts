// Public interface of the auth module. Anything not exported here is an
// implementation detail — other modules and app/ routes should only ever
// import from "@/modules/auth", never reach into
// "@/modules/auth/services/authService" directly. Keeps module boundaries
// real as more of these get built out (profile, kyc, trips, ...).
export { EmailEntryScreen } from "./screens/EmailEntryScreen";
export { OtpVerifyScreen } from "./screens/OtpVerifyScreen";
export { useAuthSession } from "./hooks/useAuthSession";
export { signOut } from "./services/authService";
export type { AuthSessionState } from "./types";
