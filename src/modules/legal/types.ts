export type ConsentType = "kyc" | "location" | "chat";

export interface ConsentStatus {
  kyc: boolean;
  location: boolean;
  chat: boolean;
  complete: boolean;
}
