import { Reaction } from './reaction.interface';

/**
 * Message row in the messages table.
 *
 * The message type is determined by which target field is set:
 * - Private message: senderId + userId
 * - Channel message:  senderId + channelId
 * - Thread reply:     senderId + threadId
 *
 * Unused target fields are empty ('').
 */
export interface Message {
  id: string;
  text: string;
  reactions: Reaction[];
  createdAt: Date | string;
  senderId: string;
  userId: string | null;
  threadId: string | null;
  channelId: string | null;
}
