import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateFormatService } from '../services/date-format.service';

@Pipe({ name: 'dayLabel', standalone: true })
export class DayLabelPipe implements PipeTransform {
  private dateFormat = inject(DateFormatService);

  transform(value: unknown): string {
    return this.dateFormat.getDayLabel(value);
  }
}
