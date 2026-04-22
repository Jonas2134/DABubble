import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { CrossTabSessionStorage } from './cross-tab-session-storage';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabaseUrl,
      environment.supabaseAnonKey,
      {
        auth: {
          storage: new CrossTabSessionStorage(),
        },
      }
    );
  }

  get supabase(): SupabaseClient {
    return this.client;
  }
}
