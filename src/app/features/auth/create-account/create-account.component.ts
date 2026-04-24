import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../../../ui/button/button.component';
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
import { Router } from '@angular/router';
import { AuthentificationService } from '../../../shared/services/authentification.service';
import { CustomInputComponent } from '../../../ui/custom-input/custom-input.component';
import { LoggerService } from '../../../shared/services/logger.service';

function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value as string;
    if (!value) return null;
    const hasUpper   = /[A-Z]/.test(value);
    const hasLower   = /[a-z]/.test(value);
    const hasNumber  = /\d/.test(value);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};:'"\\|,.<>/?]/.test(value);

    const valid = hasUpper && hasLower && hasNumber && hasSpecial;
    return valid ? null : { strongPassword: true };
  };
}

@Component({
  selector: 'app-create-account',
  imports: [ButtonComponent, ReactiveFormsModule, CustomInputComponent, IconComponent],
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.scss', './create-account-checkbox.component.scss'],
})
export class CreateAccountComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  router = inject(Router);
  private authService = inject(AuthentificationService);
  registerForm!: FormGroup;
  confError = '';

  ngOnInit(): void {
    this.registerForm = new FormGroup({
      regName: new FormControl('', [Validators.required, Validators.minLength(3)]),
      regEmail: new FormControl('', [Validators.required, Validators.email]),
      regPassword: new FormControl('', [Validators.required, Validators.minLength(8), strongPasswordValidator()]),
      acceptPrivacy: new FormControl(false, Validators.requiredTrue),
    });

    this.registerForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.confError) this.confError = '';
      });
  }

  onSubmit(): void {
    if (!this.registerForm.valid) return;

    const { regEmail, regPassword, regName } = this.registerForm.value;
    this.registerUser(regEmail, regPassword, regName);
  }

  private registerUser(email: string, password: string, name: string): void {
    this.authService.prepareRegistration(email, password, name)
    .then(() => this.router.navigate(['/auth/select-avatar']))
    .catch(error => this.handleRegisterError(error));
  }

  private handleRegisterError(error: unknown): void {
    this.logger.error('Email is taken:', error);
    this.confError = 'Diese E-Mail ist bereits vorhanden! Bitte geben Sie eine andere E-Mail-Adresse ein.';
  }

}
