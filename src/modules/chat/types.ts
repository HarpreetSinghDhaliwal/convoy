export interface Message {
  id: string;
  tripId: string;
  senderId: string;
  body: string;
  flagged: boolean;
  sentAt: string;
}
