import { Pipe, PipeTransform, inject } from '@angular/core';
import { Timestamp } from 'firebase/firestore';
import { DateFormatService } from '../services/date-format.service';

@Pipe({ name: 'timeInHours', standalone: true })
export class TimeInHoursPipe implements PipeTransform {
  private dateFormat = inject(DateFormatService);

  transform(value: Timestamp | null): string | undefined {
    return this.dateFormat.getTimeInHours(value);
  }
}
