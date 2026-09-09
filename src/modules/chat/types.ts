export interface Message {
  id: string;
  tripId: string;
  senderId: string;
  recipientId?: string | null;
  body: string;
  flagged: boolean;
  sentAt: string;
}

export interface ActiveTripChat {
  tripId: string;
  chatId: string;
  destination: string;
  originLabel: string;
  departAt: string;
  leadId: string;
  leadName?: string;
  leadPhotoUrl?: string;
  isLead: boolean;
  partnerId?: string;
  partnerName?: string;
  partnerPhotoUrl?: string;
  isGroup?: boolean;
  groupChatEnabled?: boolean;
  lastMessage?: Message;
  unreadCount: number;
}
