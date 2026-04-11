import { Injectable, inject, signal, computed, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { Channel } from '../interfaces/channel.interface';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private supabaseService = inject(SupabaseService);
  private injector = inject(Injector);

  private _channels = signal<Channel[]>([]);
  readonly channels = this._channels.asReadonly();

  constructor() {
    this.loadAllChannels();
    this.subscribeToChanges();
  }

  private async loadAllChannels() {
    const { data, error } = await this.supabaseService.supabase
      .from('channels')
      .select('*, channel_members(user_id)')
      .order('created_at');
    if (error) { console.error('loadAllChannels', error); return; }
    this._channels.set((data ?? []).map(r => this.mapChannel(r)));
  }

  private subscribeToChanges() {
    this.supabaseService.supabase
      .channel('channels-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
        this.loadAllChannels();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channel_members' }, () => {
        this.loadAllChannels();
      })
      .subscribe();
  }

  private mapChannel(row: any): Channel {
    return {
      id: row.id,
      name: row.name ?? '',
      description: row.description ?? null,
      createdByUser: row.created_by_user ?? '',
      memberIds: (row.channel_members ?? []).map((m: any) => m.user_id),
      createdAt: row.created_at ?? new Date().toISOString(),
    };
  }

  // --- Read (Observable, realtime via signal) ---

  getChannelRealtime(channelId: string): Observable<Channel> {
    const channelSignal = computed(() =>
      this._channels().find(c => c.id === channelId) ?? {
        id: channelId, name: '', description: null, createdByUser: '', memberIds: [], createdAt: new Date().toISOString()
      }
    );
    return toObservable(channelSignal, { injector: this.injector });
  }

  getSortedChannels(userId: string | null): Observable<{ id: string; name: string; createdAt: any }[]> {
    const sorted = computed(() =>
      this._channels()
        .filter(c => !userId || c.memberIds.includes(userId))
        .map(c => ({ id: c.id!, name: c.name, createdAt: c.createdAt }))
    );
    return toObservable(sorted, { injector: this.injector });
  }

  // --- Read (Promise, snapshot) ---

  async getAllChannels(): Promise<Channel[]> {
    return this._channels();
  }

  async allChannels(): Promise<Channel[]> {
    return this._channels();
  }

  async getChannel(channelId: string | null): Promise<Channel> {
    if (!channelId) return Promise.reject(new Error('No channelId'));
    const ch = this._channels().find(c => c.id === channelId);
    if (ch) return ch;

    const { data, error } = await this.supabaseService.supabase
      .from('channels')
      .select('*, channel_members(user_id)')
      .eq('id', channelId)
      .maybeSingle();
    if (error || !data) return Promise.reject(new Error('Channel not found'));
    return this.mapChannel(data);
  }

  async checkChannelNameExists(name: string): Promise<boolean> {
    const { data } = await this.supabaseService.supabase
      .from('channels')
      .select('id')
      .ilike('name', name)
      .maybeSingle();
    return !!data;
  }

  // --- Write ---

  async createChannelWithUsers(
    name: string,
    description: string,
    userId: string,
    userIds: string[]
  ): Promise<string | void> {
    const { data, error } = await this.supabaseService.supabase
      .from('channels')
      .insert({ name, description: description || null, created_by_user: userId })
      .select('id')
      .single();
    if (error) throw error;

    const channelId = data.id;
    const allIds = new Set([userId, ...userIds]);
    const rows = [...allIds].map(uid => ({ channel_id: channelId, user_id: uid }));

    const { error: memberError } = await this.supabaseService.supabase
      .from('channel_members')
      .insert(rows);
    if (memberError) throw memberError;

    return channelId;
  }

  async createChannel(name: string, description: string, userId: string): Promise<string | void> {
    return this.createChannelWithUsers(name, description, userId, [userId]);
  }

  async addUsersToChannel(channelId: string, ...userIds: string[]): Promise<void> {
    const rows = userIds.map(uid => ({ channel_id: channelId, user_id: uid }));
    const { error } = await this.supabaseService.supabase
      .from('channel_members')
      .upsert(rows, { onConflict: 'channel_id,user_id' });
    if (error) throw error;
  }

  async removeUserFromChannel(channelId: string, userId: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('channel_members')
      .delete()
      .eq('channel_id', channelId)
      .eq('user_id', userId);
    if (error) throw error;
  }

  async updateChannelName(channelId: string, newName: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('channels')
      .update({ name: newName })
      .eq('id', channelId);
    if (error) throw error;
  }

  async updateChannelDescription(channelId: string, newDescription: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('channels')
      .update({ description: newDescription })
      .eq('id', channelId);
    if (error) throw error;
  }

  async deleteChannel(channelId: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('channels')
      .delete()
      .eq('id', channelId);
    if (error) throw error;
  }

  async deleteChannelsByCreator(userId: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('channels')
      .delete()
      .eq('created_by_user', userId);
    if (error) throw error;
  }
}
