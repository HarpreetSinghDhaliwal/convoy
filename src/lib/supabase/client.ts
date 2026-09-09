import "react-native-url-polyfill/auto";
import * as SecureStore from "expo-secure-store";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/config/env";

// expo-secure-store as the session storage adapter — not AsyncStorage, since
// auth tokens shouldn't sit in plain storage on device. Note: SecureStore
// caps individual values around 2KB; if a session payload ever grows past
// that (custom JWT claims, unusually long refresh tokens), this needs to
// move to the encrypt-with-SecureStore-key + store-blob-in-AsyncStorage
// pattern Supabase's own Expo guide documents. Flagging now rather than
// finding out via a silent write failure later.
import { Platform } from "react-native";

const SecureStorageAdapter = {
  getItem: (key: string) => {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined" ? localStorage.getItem(key) : null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
