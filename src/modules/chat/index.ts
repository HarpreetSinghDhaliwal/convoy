export { ChatScreen } from "./screens/ChatScreen";
export { ChatsHubScreen } from "./screens/ChatsHubScreen";
export { RoadtripConciergeBot } from "./components/RoadtripConciergeBot";
export { useTripChat } from "./hooks/useTripChat";
export { useActiveChats } from "./hooks/useActiveChats";
export { useUnreadCount } from "./hooks/useUnreadCount";
export {
  fetchMessages,
  sendMessage,
  fetchUserActiveChats,
  getChatLastRead,
  setChatLastRead,
  subscribeToTripMessages,
  subscribeToAllUserChatMessages,
} from "./services/chatService";
export type { Message, ActiveTripChat } from "./types";
