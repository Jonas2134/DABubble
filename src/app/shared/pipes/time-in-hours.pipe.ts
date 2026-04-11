import { Pipe, PipeTransform, inject } from '@angular/core';
import { DateFormatService } from '../services/date-format.service';

@Pipe({ name: 'timeInHours', standalone: true })
export class TimeInHoursPipe implements PipeTransform {
  private dateFormat = inject(DateFormatService);

  transform(value: Date | string | null): string | undefined {
    return this.dateFormat.getTimeInHours(value);
  }
}
