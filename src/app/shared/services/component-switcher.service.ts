import { Injectable, signal } from '@angular/core';
import { LoginComponent } from '../../components/access/login/login.component';
import { CreateAccountComponent } from '../../components/access/create-account/create-account.component';
import { ImprintComponent } from '../../components/access/imprint/imprint.component';
import { PrivacyComponent } from '../../components/access/privacy/privacy.component';
import { SelectAvatarComponent } from '../../components/access/select-avatar/select-avatar.component';
import { ConfirmEmailComponent } from '../../components/access/confirm-email/confirm-email.component';
import { ConfirmPasswordComponent } from '../../components/access/confirm-password/confirm-password.component';
import { GoToEmailComponent } from '../../components/access/go-to-email/go-to-email.component';

@Injectable({
  providedIn: 'root'
})
export class ComponentSwitcherService {
  currentComponent = signal<any>(LoginComponent);

  constructor() {}

  setComponent(componentName: string): void {
    switch(componentName) {
      case 'login':
        this.currentComponent.set(LoginComponent);
        break;
      case 'signin':
        this.currentComponent.set(CreateAccountComponent);
        break;
      case 'imprint':
        this.currentComponent.set(ImprintComponent);
        break;
      case 'privacy':
        this.currentComponent.set(PrivacyComponent);
        break;
      case 'avatar':
        this.currentComponent.set(SelectAvatarComponent);
        break;
      case 'conMail':
        this.currentComponent.set(ConfirmEmailComponent);
        break;
      case 'conPassword':
        this.currentComponent.set(ConfirmPasswordComponent);
        break;
      case 'goToEmail':
        this.currentComponent.set(GoToEmailComponent);
        break;
      default:
        this.currentComponent.set(LoginComponent);
    }
  }
}
