import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';
import { noAuthGuard } from './shared/guards/no-auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent), canActivate: [noAuthGuard] },
      { path: 'signup', loadComponent: () => import('./features/auth/create-account/create-account.component').then(m => m.CreateAccountComponent) },
      { path: 'select-avatar', loadComponent: () => import('./features/auth/select-avatar/select-avatar.component').then(m => m.SelectAvatarComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/confirm-email/confirm-email.component').then(m => m.ConfirmEmailComponent) },
      { path: 'confirm-password', loadComponent: () => import('./features/auth/confirm-password/confirm-password.component').then(m => m.ConfirmPasswordComponent) },
      { path: 'check-email', loadComponent: () => import('./features/auth/go-to-email/go-to-email.component').then(m => m.GoToEmailComponent) },
      { path: 'imprint', loadComponent: () => import('./features/auth/imprint/imprint.component').then(m => m.ImprintComponent) },
      { path: 'privacy', loadComponent: () => import('./features/auth/privacy/privacy.component').then(m => m.PrivacyComponent) },
    ]
  },

  { path: 'home/:activeUserId', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), canActivate: [authGuard] },

  { path: '**', redirectTo: 'auth/login' }
];
