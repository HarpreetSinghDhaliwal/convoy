import { Button } from "@/components";
import { useFollowing } from "../hooks/useFollowing";

interface FollowButtonProps {
  userId: string;
  viaTripId: string;
}

// Only ever rendered with a specific trip in hand (a shared, completed
// trip) — there's no "follow anyone" entry point anywhere in the app, by
// design (blueprint §03).
export function FollowButton({ userId, viaTripId }: FollowButtonProps) {
  const { isFollowing, followUser, unfollowUser } = useFollowing();
  const following = isFollowing(userId);

  return (
    <Button
      label={following ? "Following" : "Follow"}
      onPress={() => (following ? unfollowUser(userId) : followUser(userId, viaTripId))}
      variant="secondary"
    />
  );
}
