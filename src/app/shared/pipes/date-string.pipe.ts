import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateFormatService } from '../services/date-format.service';

@Pipe({ name: 'dateString', standalone: true })
export class DateStringPipe implements PipeTransform {
  private dateFormat = inject(DateFormatService);

  transform(value: unknown): string {
    return this.dateFormat.getDateString(value);
  }
}
