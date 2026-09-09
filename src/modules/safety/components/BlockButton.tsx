import { Alert } from "react-native";
import { Button } from "@/components";
import { useBlockedUsers } from "../hooks/useBlockedUsers";

export function BlockButton({ userId }: { userId: string }) {
  const { isBlocked, block, unblock } = useBlockedUsers();
  const blocked = isBlocked(userId);

  function handlePress() {
    if (blocked) {
      unblock(userId);
      return;
    }
    Alert.alert(
      "Block this person?",
      "You won't see their trips or messages, and they won't see yours.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => block(userId) },
      ],
    );
  }

  return (
    <Button label={blocked ? "Unblock" : "Block"} onPress={handlePress} variant="secondary" />
  );
}
