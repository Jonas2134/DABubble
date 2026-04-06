import { Timestamp } from '@angular/fire/firestore';
import { Reaction } from './reaction.interface';

/**
 * Nachricht in der `messages` Firestore-Collection.
 *
 * Nachrichtentyp wird durch das gesetzte Zielfeld bestimmt:
 * - Private Nachricht: mSenderId + mUserId
 * - Channel-Nachricht:  mSenderId + mChannelId
 * - Thread-Antwort:     mSenderId + mThreadId
 *
 * Nicht genutzte Zielfelder sind leer ('').
 */
export interface Message {
  mId: string;
  mText: string;
  mReactions: Reaction[];
  mTime: Timestamp;
  mSenderId: string;
  mUserId: string | null;
  mThreadId: string | null;
  mChannelId: string | null;
}
