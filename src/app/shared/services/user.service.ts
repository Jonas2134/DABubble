import { Injectable, inject, signal, computed, Injector } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class UserService {
  private supabaseService = inject(SupabaseService);
  private injector = inject(Injector);

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
    this._users.set((data ?? []).map(r => this.mapUser(r)));
  }

  private subscribeToChanges() {
    this.supabaseService.supabase
      .channel('users-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) => {
        const current = this._users();
        switch (payload.eventType) {
          case 'INSERT':
            this._users.set([...current, this.mapUser(payload.new)]);
            break;
          case 'UPDATE':
            this._users.set(current.map(u => u.id === payload.new['id'] ? this.mapUser(payload.new) : u));
            break;
          case 'DELETE':
            this._users.set(current.filter(u => u.id !== payload.old['id']));
            break;
        }
      })
      .subscribe();
  }

  private mapUser(row: any): User {
    return {
      id: row.id,
      name: row.name ?? '',
      email: row.email ?? '',
      status: row.status ?? false,
      userImage: row.user_image ?? 'assets/img/profile.png',
      lastReactions: row.last_reactions ?? ['👍', '😊'],
    };
  }

  // --- Read (Observable, realtime via signal) ---

  getUserRealtime(userId: string): Observable<User | null> {
    const userSignal = computed(() =>
      this._users().find(u => u.id === userId) ?? null
    );
    return toObservable(userSignal, { injector: this.injector });
  }

  getUserById(userId: string): Observable<User | undefined> {
    const userSignal = computed(() =>
      this._users().find(u => u.id === userId)
    );
    return toObservable(userSignal, { injector: this.injector });
  }

  getEveryUsers(): Observable<User[]> {
    return toObservable(this._users, { injector: this.injector });
  }

  // --- Read (Promise, snapshot) ---

  async getAllUsers(): Promise<User[]> {
    return this._users();
  }

  async allUsers(): Promise<User[]> {
    return this._users();
  }

  async getUser(userId: string | null): Promise<User> {
    if (!userId) return Promise.reject(new Error('No userId'));
    const user = this._users().find(u => u.id === userId);
    if (user) return user;

    const { data, error } = await this.supabaseService.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return Promise.reject(new Error('User not found'));
    return this.mapUser(data);
  }

  async getFilteredUsers(userIds: string[]): Promise<User[]> {
    const idSet = new Set(userIds);
    return this._users().filter(u => idSet.has(u.id));
  }

  // --- Write ---

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
    const user = this._users().find(u => u.id === userId);
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

  // --- Deprecated: wird nach ChannelService-Migration entfernt ---

  async createChannelWithUsers(
    name: string,
    description: string,
    userId: string,
    userIds: string[]
  ): Promise<string | void> {
    console.warn('createChannelWithUsers() should be called via ChannelService');
  }
}
