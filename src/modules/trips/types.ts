export type TripMemberStatus = "requested" | "approved" | "declined" | "withdrawn" | "left";

// Tag lists rather than a fixed accommodation/meals shape — covers
// "Hotel stay", "Breakfast", "Travel guide", or anything else a Lead
// wants to list, without the app needing to know every possible category
// up front. Free text on both sides; QUICK_TAGS (CreateTripScreen) is
// just a set of common starting suggestions, not an enum.
export interface TripInclusions {
  included?: string[];
  excluded?: string[];
}

// A stop along the route between origin and destination — same for every
// rider, set by the Lead at creation time. Not the same thing as a pickup
// point (pickup-points module): that's where an individual rider boards.
export interface TripCheckpoint {
  id: string;
  tripId: string;
  label: string;
  lat: number;
  lng: number;
  sortOrder: number;
}

export interface TripLink {
  label: string;
  url: string;
  moderationStatus: "pending" | "approved" | "flagged";
}

export interface Trip {
  id: string;
  leadId: string;
  destination: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  departAt: string;
  isRoundTrip: boolean;
  returnDepartAt: string | null;
  seatsTotal: number;
  pricePerSeat: number;
  womenOnly: boolean;
  shortNote: string | null;
  description: string | null;
  inclusions: TripInclusions | null;
  links: TripLink[] | null;
  published: boolean;
  cancelledAt: string | null;
  createdAt: string;
}

export interface TripMember {
  id: string;
  tripId: string;
  userId: string;
  pickupPointId: string | null;
  status: TripMemberStatus;
  joinedAt: string;
  seatsRequested?: number;
  // Optional, best-effort — submitted when requesting to join so the Lead
  // can later ask for a suggested meeting point (routing module, §05).
  requestedLat: number | null;
  requestedLng: number | null;
}

export interface CreateTripInput {
  destination: string;
  originLabel: string;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  departAt: string;
  isRoundTrip?: boolean;
  returnDepartAt?: string;
  seatsTotal: number;
  pricePerSeat: number;
  womenOnly?: boolean;
  shortNote?: string;
  description?: string;
  inclusions?: TripInclusions;
  // Route stops, in order — inserted alongside the trip itself.
  checkpoints?: { label: string; lat: number; lng: number }[];
}

export interface TripFilters {
  destination?: string;
  womenOnlyOnly?: boolean;
  afterDate?: string;
}

export interface RequestToJoinOptions {
  pickupPointId?: string;
  seatsRequested?: number;
  // Best-effort, never required (blueprint §04 consent: location is opt-in)
  // — feeds Phase 05's suggested-meeting-point clustering, nothing else.
  requestedLat?: number;
  requestedLng?: number;
}
