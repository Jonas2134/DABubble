import { Routes } from '@angular/router';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'access', pathMatch: 'full' },
  { path: 'access', loadComponent: () => import('./pages/access/access.component').then(m => m.AccessComponent) },

  { path: 'home/:activeUserId', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent), canActivate: [authGuard] },

  { path: '**', redirectTo: 'access' }
];
