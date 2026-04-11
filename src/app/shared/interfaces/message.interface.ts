import { Reaction } from './reaction.interface';

/**
 * Nachricht in der messages-Tabelle.
 *
 * Nachrichtentyp wird durch das gesetzte Zielfeld bestimmt:
 * - Private Nachricht: senderId + userId
 * - Channel-Nachricht:  senderId + channelId
 * - Thread-Antwort:     senderId + threadId
 *
 * Nicht genutzte Zielfelder sind leer ('').
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
