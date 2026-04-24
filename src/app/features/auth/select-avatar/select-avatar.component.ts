import { Component, inject } from '@angular/core';
import { ButtonComponent } from '../../../ui/button/button.component';
import { IconComponent } from '../../../ui/icon/icon.component';
import { Router } from '@angular/router';
import { AuthentificationService } from '../../../shared/services/authentification.service';
import { SuccessIndicatorComponent } from '../../../ui/success-indicator/success-indicator.component';
import { VisibleButtonService } from '../../../shared/services/visible-button.service';
import { LoggerService } from '../../../shared/services/logger.service';

@Component({
  selector: 'app-select-avatar',
  imports: [ButtonComponent, SuccessIndicatorComponent, IconComponent],
  templateUrl: './select-avatar.component.html',
  styleUrl: './select-avatar.component.scss',
})
export class SelectAvatarComponent {
  private visibleBtn = inject(VisibleButtonService);
  private router = inject(Router);
  private authService = inject(AuthentificationService);
  private logger = inject(LoggerService);

  avatars = [
    'avatar-1.png',
    'avatar-2.png',
    'avatar-3.png',
    'avatar-4.png',
    'avatar-5.png',
    'avatar-6.png',
  ];
  selectedAvatar: string | null = null;
  username: string | undefined | null = this.authService.registrationData()?.username;
  isConfirmationVisible = false;
  avatarError = '';

  readonly isButtonVisible = this.visibleBtn.visibleButton;

  constructor() {
    this.visibleBtn.show();
  }

  goBack(): void {
    this.authService.clearRegistrationData();
    this.router.navigate(['/auth/signup']);
  }

  selectAvatar(avatar: string): void {
    this.selectedAvatar = avatar;
  }

  onNext(): void {
    if (!this.selectedAvatar) {
      this.logger.error('No avatar selected!');
      return;
    }
    this.visibleBtn.hide();
    this.completeAvatarSelection(this.selectedAvatar);
  }

  private completeAvatarSelection(avatar: string): void {
    this.authService.completeRegistration('assets/img/' + avatar)
    .then(() => this.handleAvatarSuccess())
    .catch(error => this.handleAvatarError(error));
  }
  
  private handleAvatarSuccess(): void {
    this.toggleConfirmation(true);
    setTimeout(() => this.toggleConfirmation(false), 2000);
    setTimeout(() => this.router.navigate(['/auth/login']), 3000);
  }
  
  private toggleConfirmation(visible: boolean): void {
    this.isConfirmationVisible = visible;
  }

  private handleAvatarError(error: unknown): void {
    this.visibleBtn.show();
    this.logger.error('Error when adding the profile picture:', error);
    this.avatarError = 'Registrierung fehlgeschlagen. Bitte versuche es erneut.';
  }

}
