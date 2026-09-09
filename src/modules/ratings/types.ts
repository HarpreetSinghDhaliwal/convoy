export interface Rating {
  id: string;
  tripId: string;
  raterId: string;
  rateeId: string;
  score: number;
  review: string | null;
  createdAt: string;
  isExchanged?: boolean;
  raterName?: string;
  raterPhotoUrl?: string;
}

export interface PendingRating {
  tripId: string;
  rateeId: string;
}
