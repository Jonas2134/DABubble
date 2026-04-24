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
import { Router } from '@angular/router';
import { AuthentificationService } from '../../../shared/services/authentification.service';
import { CustomInputComponent } from '../../../ui/custom-input/custom-input.component';
import { SuccessIndicatorComponent } from '../../../ui/success-indicator/success-indicator.component';
import { VisibleButtonService } from '../../../shared/services/visible-button.service';
import { LoggerService } from '../../../shared/services/logger.service';

@Component({
  selector: 'app-confirm-email',
  imports: [ButtonComponent, ReactiveFormsModule, CustomInputComponent, SuccessIndicatorComponent, IconComponent],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.scss',
})
export class ConfirmEmailComponent implements OnInit {
  private visibleBtn = inject(VisibleButtonService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  router = inject(Router);
  private authService = inject(AuthentificationService);

  confirmForm!: FormGroup;
  findEmail = '';
  isConfirmationVisible = false;

  readonly isButtonVisible = this.visibleBtn.visibleButton;

  constructor() {
    this.visibleBtn.show();
  }

  ngOnInit(): void {
    this.confirmForm = new FormGroup({
      conEmail: new FormControl('', [Validators.required, Validators.email]),
    });

    this.confirmForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.findEmail) this.findEmail = '';
      });
  }

  async onSubmit(): Promise<void> {
    if (!this.confirmForm.valid) return;
    this.visibleBtn.hide();
    const email = this.confirmForm.value.conEmail;
    await this.sendResetEmail(email);
  }

  private async sendResetEmail(email: string): Promise<void> {
    await this.authService.sendResetPasswordEmail(email)
    .then(() => this.handleSendSuccess())
    .catch(error => this.handleSendError(error));
  }

  private handleSendSuccess(): void {
    this.toggleConfirmation(true);
    setTimeout(() => this.toggleConfirmation(false), 2000);
    setTimeout(() => this.router.navigate(['/auth/check-email']), 3000);
  }

  private toggleConfirmation(visible: boolean): void {
    this.isConfirmationVisible = visible;
  }

  private handleSendError(error: unknown): void {
    this.visibleBtn.show();
    this.logger.error('Error when sending the reset email:', error);
    this.findEmail = 'Es wurde keine übereinstimmende E-Mail gefunden.';
  }

}
