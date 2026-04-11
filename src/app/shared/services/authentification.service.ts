import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthentificationService {
  private supabase = inject(SupabaseService);

  public currentUid: string | null = null;
  public registrationData: {
    email: string;
    password: string;
    username: string;
  } | null = null;

  constructor() {
    this.supabase.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUid = session?.user?.id ?? null;
    });
  }

  async prepareRegistration(email: string, password: string, username: string): Promise<void> {
    const { data } = await this.supabase.supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (data) throw { code: 'auth/email-already-in-use' };

    this.registrationData = { email, password, username };
  }

  async completeRegistration(profilePictureUrl: string): Promise<any> {
    if (!this.registrationData) throw new Error('No registration data');
    const { email, password, username } = this.registrationData;

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
    this.registrationData = null;
    return data;
  }

  async loginWithEmail(email: string, password: string): Promise<boolean> {
    const { data, error } = await this.supabase.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    this.currentUid = data.user?.id ?? null;
    return !!data.user;
  }

  async loginWithGoogle(): Promise<any> {
    const { data, error } = await this.supabase.supabase.auth.signInWithOAuth({
      provider: 'google',
    });

    if (error) throw error;
    return data;
  }

  async loginAsGuest(): Promise<any> {
    const { data, error } = await this.supabase.supabase.auth.signInAnonymously();

    if (error) throw error;
    this.currentUid = data.user?.id ?? null;

    if (data.user) {
      await this.supabase.supabase.from('users').upsert({
        id: data.user.id,
        name: 'Gast',
        email: '',
        status: true,
        user_image: 'assets/img/profile.png',
      });
    }

    return data;
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

  async logout(): Promise<void> {
    const { error } = await this.supabase.supabase.auth.signOut();
    if (error) throw error;
    this.currentUid = null;
  }
}
