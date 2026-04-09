import { Component, inject } from '@angular/core';
import { ComponentSwitcherService } from '../../../shared/services/component-switcher.service';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-imprint',
  imports: [IconComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent {
  componentSwitcher = inject(ComponentSwitcherService);

  goBack(): void {
    this.componentSwitcher.setComponent('login');
  }
}
