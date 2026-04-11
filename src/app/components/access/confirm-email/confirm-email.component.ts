import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonComponent } from '../../button/button.component';
import { IconComponent } from '../../icon/icon.component';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ComponentSwitcherService } from '../../../shared/services/component-switcher.service';
import { AuthentificationService } from '../../../shared/services/authentification.service';
import { CustomInputComponent } from '../../custom-input/custom-input.component';
import { SuccessIndicatorComponent } from '../../success-indicator/success-indicator.component';
import { VisibleButtonService } from '../../../shared/services/visible-button.service';

@Component({
  selector: 'app-confirm-email',
  imports: [ButtonComponent, ReactiveFormsModule, CustomInputComponent, SuccessIndicatorComponent, IconComponent],
  templateUrl: './confirm-email.component.html',
  styleUrl: './confirm-email.component.scss',
})
export class ConfirmEmailComponent implements OnInit {
  private visibleBtn = inject(VisibleButtonService);
  private destroyRef = inject(DestroyRef);
  componentSwitcher = inject(ComponentSwitcherService);
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
    setTimeout(() => this.changeComponent('goToEmail'), 3000);
  }

  private toggleConfirmation(visible: boolean): void {
    this.isConfirmationVisible = visible;
  }

  private handleSendError(error: unknown): void {
    this.visibleBtn.show();
    console.error('Error when sending the reset email:', error);
    this.findEmail = 'Es wurde keine übereinstimmende E-Mail gefunden.';
  }

  changeComponent(componentName: string): void {
    this.componentSwitcher.setComponent(componentName);
  }
}
