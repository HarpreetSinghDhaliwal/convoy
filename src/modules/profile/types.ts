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
  bio?: string | null;
  kycStatus: "unverified" | "pending" | "verified" | "rejected";
  emergencyContact: EmergencyContact | null;
  createdAt?: string | null;
}

export interface PublicProfile {
  id: string;
  name: string | null;
  photoUrl: string | null;
  bio?: string | null;
  kycStatus: "unverified" | "pending" | "verified" | "rejected";
  createdAt?: string | null;
}
