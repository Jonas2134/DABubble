import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VisibleButtonService {
  private _visibleButton = signal(true);
  readonly visibleButton = this._visibleButton.asReadonly();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}

  show() {
    this._visibleButton.set(true);
  }

  hide() {
    this._visibleButton.set(false);
  }
}
