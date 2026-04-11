import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Message } from '../interfaces/message.interface';
import { Reaction } from '../interfaces/reaction.interface';
import { SupabaseService } from './supabase.service';

interface MessageRow {
  id: string;
  text: string | null;
  sender_id: string | null;
  user_id: string | null;
  thread_id: string | null;
  channel_id: string | null;
  created_at: string | null;
  reactions?: ReactionRow[];
}

interface ReactionRow {
  emoji: string;
  user_id: string;
  user_name: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private supabaseService = inject(SupabaseService);
  private subCounter = 0;

  private mapMessage(row: MessageRow): Message {
    return {
      id: row.id,
      text: row.text ?? '',
      reactions: (row.reactions ?? []).map(r => ({
        emoji: r.emoji,
        userId: r.user_id,
        userName: r.user_name,
      })),
      createdAt: row.created_at ?? new Date().toISOString(),
      senderId: row.sender_id ?? '',
      userId: row.user_id ?? null,
      threadId: row.thread_id ?? null,
      channelId: row.channel_id ?? null,
    };
  }

  private async fetchMessages(
    chatType: string,
    chatId: string | null,
    activeUserId: string | null
  ): Promise<Message[]> {
    let query = this.supabaseService.supabase
      .from('messages')
      .select('*, reactions(*)')
      .order('created_at');

    switch (chatType) {
      case 'channel':
        query = query.eq('channel_id', chatId!);
        break;
      case 'private':
        query = query.or(
          `and(sender_id.eq.${activeUserId},user_id.eq.${chatId}),and(sender_id.eq.${chatId},user_id.eq.${activeUserId})`
        );
        break;
      case 'thread':
        query = query.eq('thread_id', chatId!);
        break;
      default:
        return [];
    }

    const { data, error } = await query;
    if (error) { console.error('fetchMessages', error); return []; }
    return (data ?? []).map(r => this.mapMessage(r as MessageRow));
  }

  getMessages(
    chatType: 'private' | 'channel' | 'thread' | 'new',
    chatId: string | null,
    activeUserId: string | null
  ): Observable<Message[]> {
    if (chatType === 'new' || !chatId) {
      return new Observable(sub => { sub.next([]); });
    }

    return new Observable(subscriber => {
      this.fetchMessages(chatType, chatId, activeUserId).then(msgs =>
        subscriber.next(msgs)
      );

      const channelName = `msgs-${chatType}-${chatId}-${++this.subCounter}`;
      const sub = this.supabaseService.supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          this.fetchMessages(chatType, chatId, activeUserId).then(msgs =>
            subscriber.next(msgs)
          );
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, () => {
          this.fetchMessages(chatType, chatId, activeUserId).then(msgs =>
            subscriber.next(msgs)
          );
        })
        .subscribe();

      return () => {
        this.supabaseService.supabase.removeChannel(sub);
      };
    });
  }

  getThreadMessages(chatId: string | null): Observable<Message[]> {
    if (!chatId) {
      return new Observable(sub => { sub.next([]); });
    }

    return new Observable(subscriber => {
      this.fetchThreadMessages(chatId).then(msgs => subscriber.next(msgs));

      const channelName = `thread-${chatId}-${++this.subCounter}`;
      const sub = this.supabaseService.supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
          this.fetchThreadMessages(chatId).then(msgs => subscriber.next(msgs));
        })
        .subscribe();

      return () => {
        this.supabaseService.supabase.removeChannel(sub);
      };
    });
  }

  private async fetchThreadMessages(threadId: string): Promise<Message[]> {
    const { data, error } = await this.supabaseService.supabase
      .from('messages')
      .select('*, reactions(*)')
      .eq('thread_id', threadId)
      .order('created_at');
    if (error) { console.error('fetchThreadMessages', error); return []; }
    return (data ?? []).map(r => this.mapMessage(r as MessageRow));
  }

  async getAllMessages(): Promise<Message[]> {
    const { data, error } = await this.supabaseService.supabase
      .from('messages')
      .select('*, reactions(*)')
      .order('created_at');
    if (error) { console.error('getAllMessages', error); return []; }
    return (data ?? []).map(r => this.mapMessage(r as MessageRow));
  }

  async createMessage(message: Partial<Message>): Promise<MessageRow> {
    const { data, error } = await this.supabaseService.supabase
      .from('messages')
      .insert({
        text: message.text ?? '',
        sender_id: message.senderId ?? '',
        user_id: message.userId || null,
        channel_id: message.channelId || null,
        thread_id: message.threadId || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as MessageRow;
  }

  async editMessageText(messageId: string, newText: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('messages')
      .update({ text: newText })
      .eq('id', messageId);
    if (error) throw error;
  }

  async deleteMessage(messageId: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('messages')
      .delete()
      .eq('id', messageId);
    if (error) throw error;
  }

  async deleteMessagesBySender(senderId: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('messages')
      .delete()
      .eq('sender_id', senderId);
    if (error) throw error;
  }

  async toggleReaction(messageId: string, reaction: Reaction): Promise<void> {
    const { data } = await this.supabaseService.supabase
      .from('reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', reaction.userId)
      .eq('emoji', reaction.emoji)
      .maybeSingle();

    if (data) {
      const { error } = await this.supabaseService.supabase
        .from('reactions')
        .delete()
        .eq('id', data.id);
      if (error) throw error;
    } else {
      const { error } = await this.supabaseService.supabase
        .from('reactions')
        .insert({
          message_id: messageId,
          user_id: reaction.userId,
          user_name: reaction.userName,
          emoji: reaction.emoji,
        });
      if (error) throw error;
    }
  }

  async startThread(parentMessageId: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('messages')
      .update({ thread_id: parentMessageId })
      .eq('id', parentMessageId);
    if (error) throw error;
  }

  async replyInThread(threadId: string, text: string, senderId: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('messages')
      .insert({
        text,
        sender_id: senderId,
        thread_id: threadId,
      });
    if (error) throw error;
  }
}
