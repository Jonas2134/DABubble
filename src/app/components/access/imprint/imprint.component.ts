import { Component } from '@angular/core';
import { ComponentSwitcherService } from '../../../shared/services/component-switcher.service';
import { IconComponent } from '../../icon/icon.component';

@Component({
  selector: 'app-imprint',
  imports: [IconComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss'
})
export class ImprintComponent {
  constructor(public componentSwitcher: ComponentSwitcherService) {}

  goBack(): void {
    this.componentSwitcher.setComponent('login');
  }
}
