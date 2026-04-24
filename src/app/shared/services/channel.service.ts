import { Injectable, inject, signal } from '@angular/core';
import { Channel } from '../interfaces/channel.interface';
import { SupabaseService } from './supabase.service';
import { LoggerService } from './logger.service';

interface ChannelRow {
  id: string;
  name: string | null;
  description: string | null;
  created_by_user: string | null;
  created_at: string | null;
  channel_members?: { user_id: string }[];
}

@Injectable({ providedIn: 'root' })
export class ChannelService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  private _channels = signal<Channel[]>([]);
  readonly channels = this._channels.asReadonly();

  constructor() {
    this.loadAllChannels();
    this.subscribeToChanges();
  }

  reload() {
    this.loadAllChannels();
  }

  private async loadAllChannels() {
    const { data, error } = await this.supabaseService.supabase
      .from('channels')
      .select('*, channel_members(user_id)')
      .order('created_at');
    if (error) { this.logger.error('loadAllChannels', error); return; }
    this._channels.set((data ?? []).map(r => this.mapChannel(r as ChannelRow)));
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

  private mapChannel(row: ChannelRow): Channel {
    return {
      id: row.id,
      name: row.name ?? '',
      description: row.description ?? null,
      createdByUser: row.created_by_user ?? '',
      memberIds: (row.channel_members ?? []).map(m => m.user_id),
      createdAt: row.created_at ?? new Date().toISOString(),
    };
  }

  getChannelById(channelId: string): Channel | undefined {
    return this._channels().find(c => c.id === channelId);
  }

  async checkChannelNameExists(name: string): Promise<boolean> {
    const { data } = await this.supabaseService.supabase
      .from('channels')
      .select('id')
      .ilike('name', name)
      .maybeSingle();
    return !!data;
  }

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
      .rpc('delete_channel', { p_channel_id: channelId });
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
