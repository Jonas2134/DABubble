import { Component, inject, OnInit } from '@angular/core';
import { IconComponent } from '../../../ui/icon/icon.component';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ButtonComponent } from '../../../ui/button/button.component';
import { Router } from '@angular/router';
import { AuthentificationService } from '../../../shared/services/authentification.service';
import { CustomInputComponent } from '../../../ui/custom-input/custom-input.component';
import { SuccessIndicatorComponent } from '../../../ui/success-indicator/success-indicator.component';
import { VisibleButtonService } from '../../../shared/services/visible-button.service';

@Component({
  selector: 'app-confirm-password',
  imports: [
    ButtonComponent,
    ReactiveFormsModule,
    CustomInputComponent,
    SuccessIndicatorComponent,
    IconComponent,
  ],
  templateUrl: './confirm-password.component.html',
  styleUrl: './confirm-password.component.scss',
})
export class ConfirmPasswordComponent implements OnInit {
  private visibleBtn = inject(VisibleButtonService);
  private router = inject(Router);
  private authService = inject(AuthentificationService);

  newPassword!: FormGroup;
  isConfirmationVisible = false;
  authError = '';

  readonly isRecoveryMode = this.authService.isRecoveryMode;

  static passwordMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
    const newPassword = group.get('newPassword')?.value;
    const conPassword = group.get('conPassword')?.value;
    return newPassword === conPassword ? null : { passwordMismatch: true };
  };

  readonly isButtonVisible = this.visibleBtn.visibleButton;

  constructor() {
    this.visibleBtn.show();
  }

  ngOnInit(): void {
    this.newPassword = new FormGroup({
      newPassword: new FormControl('', [Validators.required, Validators.minLength(8),]),
      conPassword: new FormControl('', [Validators.required, Validators.minLength(8),]),
    },
    { validators: ConfirmPasswordComponent.passwordMatchValidator }
    );

    setTimeout(() => {
      if (!this.isRecoveryMode()) {
        this.authError = 'Kein gültiger Wiederherstellungslink. Bitte fordere einen neuen an.';
      }
    }, 1500);
  }

  isPasswordMismatch(): boolean {
    return (!!this.newPassword.errors && this.newPassword.errors['passwordMismatch']);
  }

  onSubmit(): void {
    if (!this.newPassword.valid) return;

    if (!this.isRecoveryMode()) {
      this.authError = 'Kein gültiger Wiederherstellungslink. Bitte fordere einen neuen an.';
      return;
    }

    this.visibleBtn.hide();
    const { newPassword } = this.newPassword.value;
    this.processPasswordReset(newPassword);
  }

  private processPasswordReset(newPwd: string): void {
    this.authService.confirmResetPassword(newPwd)
    .then(() => this.handleResetSuccess())
    .catch(error => this.handleResetError(error));
  }
  
  private handleResetSuccess(): void {
    this.toggleConfirmation(true);
    setTimeout(() => this.toggleConfirmation(false), 2000);
  
    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 3000);
  }
  
  private toggleConfirmation(visible: boolean): void {
    this.isConfirmationVisible = visible;
  }
  
  private handleResetError(error: unknown): void {
    this.visibleBtn.show();
    console.error('Error when resetting the password:', error);
    this.authError = 'Passwort konnte nicht zurückgesetzt werden. Bitte versuche es erneut.';
  }

  goBackToEmailConfirm(): void {
    this.router.navigate(['/auth/reset-password']);
  }
}
