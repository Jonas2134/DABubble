import { Injectable, isDevMode } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  error(message: string, ...args: unknown[]): void {
    if (isDevMode()) {
      console.error(message, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (isDevMode()) {
      console.warn(message, ...args);
    }
  }
}
