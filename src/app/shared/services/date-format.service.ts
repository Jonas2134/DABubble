import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DateFormatService {
  getDay(t: unknown): number {
    const d = this.toDate(t);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  getDateString(t: unknown): string {
    const d = this.toDate(t);
    const diff = this.getDay(d) - this.getDay(new Date());

    if (diff === 0) return 'Heute';
    if (diff === -86400000) return 'Gestern';

    return d.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  getDayLabel(t: unknown): string {
    const d = this.toDate(t);
    const todayMid = new Date().setHours(0, 0, 0, 0);
    const msgMid = this.getDay(d);

    if (msgMid === todayMid) return 'Heute';
    if (msgMid === todayMid - 86400000) return 'Gestern';

    return this.formatAsGermanDate(d);
  }

  getTimeInHours(ts: Date | string | null): string | undefined {
    if (!ts) return undefined;
    const d = this.toDate(ts);
    return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  private formatAsGermanDate(d: Date): string {
    return (
      `${String(d.getDate()).padStart(2, '0')}.` +
      `${String(d.getMonth() + 1).padStart(2, '0')}.` +
      d.getFullYear()
    );
  }

  private toDate(t: unknown): Date {
    if (t instanceof Date) return t;
    if (t && typeof t === 'object' && 'toDate' in t && typeof (t as any).toDate === 'function') {
      return (t as any).toDate();
    }
    return new Date(t as any);
  }
}
