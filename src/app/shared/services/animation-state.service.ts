import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AnimationStateService {
  readonly animationShown = signal(false);

  markAsShown() {
    this.animationShown.set(true);
  }
}
