import { Button } from "@/components";
import { useFollowing } from "../hooks/useFollowing";

interface FollowButtonProps {
  userId: string;
  viaTripId?: string;
  size?: "sm" | "md" | "lg";
}

export function FollowButton({ userId, viaTripId, size = "md" }: FollowButtonProps) {
  const { isFollowing, followUser, unfollowUser } = useFollowing();
  const following = isFollowing(userId);

  return (
    <Button
      label={following ? "✓ Following" : "+ Follow"}
      onPress={() => (following ? unfollowUser(userId) : followUser(userId, viaTripId))}
      variant={following ? "secondary" : "primary"}
      size={size}
    />
  );
}
