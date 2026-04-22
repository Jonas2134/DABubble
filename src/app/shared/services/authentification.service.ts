import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';

interface RegistrationData {
  email: string;
  password: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthentificationService {
  private supabase = inject(SupabaseService);
  private userService = inject(UserService);

  private _currentUid = signal<string | null>(null);
  readonly currentUid = this._currentUid.asReadonly();

  private _registrationData = signal<RegistrationData | null>(null);
  readonly registrationData = this._registrationData.asReadonly();

  private _isRecoveryMode = signal(false);
  readonly isRecoveryMode = this._isRecoveryMode.asReadonly();

  private _isGuest = signal(false);
  readonly isGuest = this._isGuest.asReadonly();

  constructor() {
    this.supabase.supabase.auth.onAuthStateChange((event, session) => {
      this._currentUid.set(session?.user?.id ?? null);
      this._isGuest.set(session?.user?.is_anonymous === true);

      if (event === 'SIGNED_IN' && session?.user?.id) {
        this.userService.updateUserStatus(session.user.id, true);
      }
      if (event === 'PASSWORD_RECOVERY') {
        this._isRecoveryMode.set(true);
      }
      if (event === 'SIGNED_OUT') {
        this._isGuest.set(false);
      }
    });

    window.addEventListener('beforeunload', () => {
      const uid = this._currentUid();
      if (!uid || this._isGuest()) return;
      const url = `${environment.supabaseUrl}/rest/v1/users?id=eq.${uid}`;
      const key = environment.supabaseAnonKey;
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key,
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({ status: false }),
        keepalive: true,
      });
    });
  }

  async prepareRegistration(email: string, password: string, username: string): Promise<void> {
    const { data } = await this.supabase.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (data) throw { code: 'auth/email-already-in-use' };

    this._registrationData.set({ email, password, username });
  }

  async completeRegistration(profilePictureUrl: string): Promise<void> {
    const regData = this._registrationData();
    if (!regData) throw new Error('No registration data');
    const { email, password, username } = regData;

    const { data, error } = await this.supabase.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: username,
          user_image: profilePictureUrl,
        },
      },
    });

    if (error) throw error;

    if (data.session && data.user) {
      const { error: updateError } = await this.supabase.supabase
        .from('users')
        .update({ user_image: profilePictureUrl })
        .eq('id', data.user.id);
      if (updateError) console.warn('Fallback user_image update failed:', updateError.message);
    }

    this._registrationData.set(null);
  }

  async loginWithEmail(email: string, password: string): Promise<boolean> {
    const { data, error } = await this.supabase.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    this._currentUid.set(data.user?.id ?? null);
    return !!data.user;
  }

  async loginWithGoogle(): Promise<void> {
    sessionStorage.setItem('pendingOAuthLogin', 'true');
    const { error } = await this.supabase.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/login'
      }
    });
    if (error) {
      sessionStorage.removeItem('pendingOAuthLogin');
      throw error;
    }
  }

  async loginAsGuest(): Promise<void> {
    const { data, error } = await this.supabase.supabase.auth.signInAnonymously();
    if (error) throw error;

    this._currentUid.set(data.user?.id ?? null);
    this._isGuest.set(true);

    if (data.user) {
      await this.supabase.supabase.from('users').upsert({
        id: data.user.id,
        name: 'Gast',
        email: '',
        status: true,
        user_image: 'assets/img/profile.png',
      });

      const { data: channel } = await this.supabase.supabase
        .from('channels')
        .select('id')
        .eq('name', 'Allgemein')
        .single();

      if (channel) {
        await this.supabase.supabase.from('channel_members').upsert({
          channel_id: channel.id,
          user_id: data.user.id,
        });
      }
    }
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    const redirectTo = `${window.location.origin}/auth/confirm-password`;
    const { error } = await this.supabase.supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    if (error) throw error;
  }

  async confirmResetPassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    this._isRecoveryMode.set(false);
  }

  clearRegistrationData(): void {
    this._registrationData.set(null);
  }

  async logout(): Promise<void> {
    const uid = this._currentUid();
    if (this._isGuest()) {
      const { error } = await this.supabase.supabase.rpc('delete_anonymous_user');
      if (error) console.warn('Guest cleanup failed:', error.message);
    } else if (uid) {
      await this.userService.updateUserStatus(uid, false);
    }
    const { error } = await this.supabase.supabase.auth.signOut();
    if (error) throw error;
    this._currentUid.set(null);
    this._isGuest.set(false);
  }
}
