import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../../ui/icon/icon.component';

@Component({
  selector: 'app-privacy',
  imports: [IconComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }
}
