export interface Message {
  id: string;
  tripId: string;
  senderId: string;
  body: string;
  flagged: boolean;
  sentAt: string;
}

export interface ActiveTripChat {
  tripId: string;
  destination: string;
  originLabel: string;
  departAt: string;
  leadId: string;
  leadName?: string;
  leadPhotoUrl?: string;
  isLead: boolean;
  lastMessage?: Message;
  unreadCount: number;
}
