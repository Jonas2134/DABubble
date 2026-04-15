import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from '../../../ui/icon/icon.component';

@Component({
  selector: 'app-imprint',
  imports: [IconComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent {
  private router = inject(Router);

  goBack(): void {
    this.router.navigate(['/auth/login']);
  }
}
