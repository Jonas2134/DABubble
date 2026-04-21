import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { LogoComponent } from '../../features/auth/logo/logo.component';
import { IconComponent } from '../../ui/icon/icon.component';
import { ButtonComponent } from '../../ui/button/button.component';
import { VisibleButtonService } from '../../shared/services/visible-button.service';
import { AnimationStateService } from '../../shared/services/animation-state.service';

@Component({
  selector: 'app-auth',
  imports: [RouterOutlet, LogoComponent, ButtonComponent, IconComponent],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss'
})
export class AuthComponent implements OnInit {
  private visibleBtn = inject(VisibleButtonService);
  private animationState = inject(AnimationStateService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  readonly showAnimation = this.animationState.animationShown;
  readonly isButtonVisible = this.visibleBtn.visibleButton;

  ngOnInit(): void {
    this.handleResetMode();
  }

  handleResetMode() {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    const oobCode = this.route.snapshot.queryParamMap.get('oobCode');
    if (mode === 'resetPassword') {
      this.router.navigate(['/auth/confirm-password'], { queryParams: { oobCode } });
    }
  }

  isLoginRoute(): boolean {
    return this.router.url === '/auth/login' || this.router.url === '/auth';
  }

  isLegalRoute(): boolean {
    return this.router.url === '/auth/imprint' || this.router.url === '/auth/privacy';
  }
}
