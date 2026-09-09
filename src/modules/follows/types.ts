export interface Follow {
  id: string;
  followerId: string;
  followedId: string;
  viaTripId?: string | null;
  createdAt: string;
  followedUser?: {
    id: string;
    name: string;
    photoUrl?: string;
    bio?: string;
  };
}

export interface FollowStats {
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}
