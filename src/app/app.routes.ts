import { Routes } from '@angular/router';
import { AccessComponent } from './features/access/access.component';
import { MainContentComponent } from './features/main-content/main-content.component';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'access', pathMatch: 'full' },
  { path: 'access', component: AccessComponent },

  { path: 'home/:activeUserId', component: MainContentComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'access' }
];
