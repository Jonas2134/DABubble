import { Component, Input } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-success-indicator',
  imports: [],
  template: `
    @if (visible) {
      <div @slideInFromRight>
        <ng-content></ng-content>
      </div>
    }
  `,
  styleUrl: './success-indicator.component.scss',
  animations: [
    trigger('slideInFromRight', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('500ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('500ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class SuccessIndicatorComponent {
  @Input() visible = false;
}
