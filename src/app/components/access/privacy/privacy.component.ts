import { Component } from '@angular/core';
import { ComponentSwitcherService } from '../../../shared/services/component-switcher.service';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-privacy',
  imports: [IconComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
})
export class PrivacyComponent {
  constructor(public componentSwitcher: ComponentSwitcherService) {}

  goBack(): void {
    this.componentSwitcher.setComponent('login');
  }
}
