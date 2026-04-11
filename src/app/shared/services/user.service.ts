import { Injectable, inject, signal } from '@angular/core';
import { User } from '../interfaces/user.interface';
import { SupabaseService } from './supabase.service';

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  status: boolean | null;
  user_image: string | null;
  last_reactions: string[] | null;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private supabaseService = inject(SupabaseService);

  private _users = signal<User[]>([]);
  readonly users = this._users.asReadonly();

  constructor() {
    this.loadAllUsers();
    this.subscribeToChanges();
  }

  private async loadAllUsers() {
    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('*');
    if (error) { console.error('loadAllUsers', error); return; }
    this._users.set((data ?? []).map(r => this.mapUser(r as UserRow)));
  }

  private subscribeToChanges() {
    this.supabaseService.supabase
      .channel('users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        const current = this._users();
        switch (payload.eventType) {
          case 'INSERT':
            this._users.set([...current, this.mapUser(payload.new as UserRow)]);
            break;
          case 'UPDATE':
            this._users.set(current.map(u => u.id === (payload.new as UserRow).id ? this.mapUser(payload.new as UserRow) : u));
            break;
          case 'DELETE':
            this._users.set(current.filter(u => u.id !== (payload.old as { id: string }).id));
            break;
        }
      })
      .subscribe();
  }

  private mapUser(row: UserRow): User {
    return {
      id: row.id,
      name: row.name ?? '',
      email: row.email ?? '',
      status: row.status ?? false,
      userImage: row.user_image ?? 'assets/img/profile.png',
      lastReactions: row.last_reactions ?? ['👍', '😊'],
    };
  }

  getUserById(userId: string): User | undefined {
    return this._users().find(u => u.id === userId);
  }

  async updateUserImage(userId: string, imageFileName: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('users')
      .update({ user_image: imageFileName })
      .eq('id', userId);
    if (error) throw error;
  }

  async updateUserName(userId: string, name: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('users')
      .update({ name })
      .eq('id', userId);
    if (error) throw error;
  }

  async editLastReactions(userId: string | null, reaction: string): Promise<void> {
    if (!userId) return;
    const user = this.getUserById(userId);
    const current = user?.lastReactions ?? ['👍', '😊'];
    const filtered = current.filter(r => r !== reaction);
    const updated = [reaction, ...filtered].slice(0, 2);

    const { error } = await this.supabaseService.supabase
      .from('users')
      .update({ last_reactions: updated })
      .eq('id', userId);
    if (error) throw error;
  }

  async deleteUser(userId: string): Promise<void> {
    const { error } = await this.supabaseService.supabase
      .from('users')
      .delete()
      .eq('id', userId);
    if (error) throw error;
  }
}
