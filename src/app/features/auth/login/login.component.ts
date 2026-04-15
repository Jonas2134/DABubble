import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../../../ui/button/button.component';
import { IconComponent } from '../../../ui/icon/icon.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthentificationService } from '../../../shared/services/authentification.service';
import { Router } from '@angular/router';
import { CustomInputComponent } from '../../../ui/custom-input/custom-input.component';
import { SuccessIndicatorComponent } from '../../../ui/success-indicator/success-indicator.component';
import { VisibleButtonService } from '../../../shared/services/visible-button.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ButtonComponent, ReactiveFormsModule, CustomInputComponent, SuccessIndicatorComponent, IconComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private visibleBtn = inject(VisibleButtonService);
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthentificationService);
  router = inject(Router);

  loginForm!: FormGroup;
  authError = '';
  isConfirmationVisible = false;

  readonly isButtonVisible = this.visibleBtn.visibleButton;

  constructor() {
    this.visibleBtn.show();
  }

  ngOnInit(): void {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email, Validators.pattern('[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}')]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    });

    this.loginForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.authError) this.authError = '';
      });
  }

  onSubmit(): void {
    if (!this.loginForm.valid) return;

    this.visibleBtn.hide();
    const { email, password } = this.loginForm.value;
    this.attemptLogin(email, password);
  }

  private attemptLogin(email: string, password: string): void {
    this.authService.loginWithEmail(email, password)
    .then(success => {
      if (success) this.showConfirmationAndNavigate();
    })
    .catch(error => this.handleLoginError(error));
  }

  private showConfirmationAndNavigate(): void {
    this.toggleConfirmation(true);
    setTimeout(() => this.toggleConfirmation(false), 2000);

    setTimeout(() => {
      const uid = this.authService.currentUid();
      this.router.navigate(['/home', uid]);
    }, 3000);
  }

  private toggleConfirmation(visible: boolean): void {
    this.isConfirmationVisible = visible;
  }

  private handleLoginError(error: { code?: string }): void {
    this.visibleBtn.show();
    console.error('Login error:', error);
    this.authError = this.mapErrorToMessage(error.code ?? '');
  }

  private mapErrorToMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
        return 'E-Mail oder Passwort ist nicht korrekt.';
      default:
        return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
    }
  }

  onLoginWithGoogle(): void {
    this.visibleBtn.hide();
    this.authService.loginWithGoogle()
    .then(() => {
      const uid = this.authService.currentUid();
      this.router.navigate(['/home', uid]);
    })
    .catch(error => {
      this.visibleBtn.show();
      console.error('Error during Google login:', error);
    });
  }

  onLoginAsGuest(): void {
    this.visibleBtn.hide();
    this.authService.loginAsGuest()
    .then(() => {
      const uid = this.authService.currentUid();
      this.router.navigate(['/home', uid]);
    })
    .catch(error => {
      this.visibleBtn.show();
      console.error('Guest login error:', error);
    });
  }

}
