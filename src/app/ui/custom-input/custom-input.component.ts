import {
  Component,
  Input,
  forwardRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-custom-input',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <label>
      <ng-content select="[icon]"></ng-content>
      <input
        #inputElement
        [type]="type"
        [name]="name"
        [placeholder]="placeholder"
        [autocomplete]="autocomplete"
        [value]="value"
        (input)="onInputChange($event)"
        (blur)="onBlur()"
      />
    </label>
  `,
  styleUrls: ['./custom-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomInputComponent),
      multi: true,
    },
  ],
})
export class CustomInputComponent implements ControlValueAccessor {
  @Input() type = 'text';
  @Input() name = '';
  @Input() placeholder = '';
  @Input() autocomplete = 'on';

  @ViewChild('inputElement') inputElement!: ElementRef;

  value = '';
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouch: () => void = () => {};
  disabled = false;

  onInputChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.onChange(value);
  }

  onBlur() {
    this.onTouch();
  }

  writeValue(value: string): void {
    this.value = value || '';
    if (this.inputElement) {
      this.inputElement.nativeElement.value = this.value;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.inputElement) {
      this.inputElement.nativeElement.disabled = isDisabled;
    }
  }
}
