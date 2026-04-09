import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

type ButtonColor = 'blue' | 'white' | 'gray' | 'transparent' | 'sky-grey' | 'rose';
type ButtonVariant = 'default' | 'icon';

@Component({
  selector: 'app-button',
  imports: [],
  template: `
    <button
      [class]="getButtonClasses()"
      [type]="type"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel || null"
      (click)="handleClick()"
    >
      @if (icon) {
        <span class="material-symbols">{{ icon }}</span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() color: ButtonColor = 'blue';
  @Input() variant: ButtonVariant = 'default';
  @Input() icon = '';
  @Input() ariaLabel = '';

  @Output() clicked = new EventEmitter<void>();

  @HostBinding('class.full-width-host')
  get isFullWidth(): boolean {
    return this.color === 'gray';
  }

  getButtonClasses(): string {
    return `btn btn-${this.color} btn-${this.variant}`;
  }

  handleClick(): void {
    this.clicked.emit();
  }
}
