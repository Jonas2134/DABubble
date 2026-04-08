import { Routes } from '@angular/router';
import { AccessComponent } from './pages/access/access.component';
import { HomeComponent } from './pages/home/home.component';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'access', pathMatch: 'full' },
  { path: 'access', component: AccessComponent },

  { path: 'home/:activeUserId', component: HomeComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'access' }
];
