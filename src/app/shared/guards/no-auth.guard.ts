import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const noAuthGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  await supabase.sessionReady;
  const { data: { session } } = await supabase.supabase.auth.getSession();
  if (session) {
    router.navigate(['/home', session.user.id]);
    return false;
  }
  return true;
};
