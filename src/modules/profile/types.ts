export interface EmergencyContact {
  name: string;
  phone: string;
  relationship?: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  phone: string | null;
  photoUrl: string | null;
  kycStatus: "unverified" | "pending" | "verified" | "rejected";
  emergencyContact: EmergencyContact | null;
}

// Deliberately thin — this is exactly the public_profiles view's column
// set (migration 0011). Phone, kyc_doc_hash, emergency_contact are not
// here and never will be; that's the whole point of the view.
export interface PublicProfile {
  id: string;
  name: string | null;
  photoUrl: string | null;
  kycStatus: "unverified" | "pending" | "verified" | "rejected";
}
