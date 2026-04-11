import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

interface RegistrationData {
  email: string;
  password: string;
  username: string;
}

@Injectable({ providedIn: 'root' })
export class AuthentificationService {
  private supabase = inject(SupabaseService);

  private _currentUid = signal<string | null>(null);
  readonly currentUid = this._currentUid.asReadonly();

  private _registrationData = signal<RegistrationData | null>(null);
  readonly registrationData = this._registrationData.asReadonly();

  constructor() {
    this.supabase.supabase.auth.onAuthStateChange((_event, session) => {
      this._currentUid.set(session?.user?.id ?? null);
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

    const { error } = await this.supabase.supabase.auth.signUp({
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
    const { error } = await this.supabase.supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
  }

  async loginAsGuest(): Promise<void> {
    const { data, error } = await this.supabase.supabase.auth.signInAnonymously();
    if (error) throw error;

    this._currentUid.set(data.user?.id ?? null);

    if (data.user) {
      await this.supabase.supabase.from('users').upsert({
        id: data.user.id,
        name: 'Gast',
        email: '',
        status: true,
        user_image: 'assets/img/profile.png',
      });
    }
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    const { error } = await this.supabase.supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async confirmResetPassword(_oobCode: string, newPassword: string): Promise<void> {
    const { error } = await this.supabase.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  clearRegistrationData(): void {
    this._registrationData.set(null);
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.supabase.auth.signOut();
    if (error) throw error;
    this._currentUid.set(null);
  }
}
