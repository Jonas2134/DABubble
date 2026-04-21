import { CommonModule } from '@angular/common';
import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { IconComponent } from '../../../ui/icon/icon.component';
import { AnimationStateService } from '../../../shared/services/animation-state.service';
import {
  trigger,
  state,
  style,
  transition,
  animate,
  keyframes,
} from '@angular/animations';

@Component({
  selector: 'app-logo',
  imports: [CommonModule, IconComponent],
  templateUrl: './logo.component.html',
  styleUrl: './logo.component.scss',
  animations: [
    trigger('logoPosition', [
      state('center', style({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(3.5)'
      })),
      state('topLeft', style({
        top: '75px',
        left: '75px',
        transform: 'translate(0, 0) scale(1)'
      })),
      state('centerMobile', style({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1.5)'
      })),
      state('topLeftMobile', style({
        top: '30px',
        left: '50%',
        transform: 'translate(-50%, 0) scale(1)'
      })),
      transition('center => topLeft', [
        animate('1500ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ]),
      transition('centerMobile => topLeftMobile', [
        animate('1500ms cubic-bezier(0.4,0.0,0.2,1)')
      ])
    ]),

    trigger('textAnimation', [
      state('hidden', style({
        width: '0px',
        opacity: 0,
        overflow: 'hidden'
      })),
      state('visible', style({
        width: '*',
        opacity: 1,
        overflow: 'visible'
      })),
      transition('hidden => visible', [
        animate('800ms cubic-bezier(0.0, 0.0, 0.2, 1)', keyframes([
          style({ width: '0px', opacity: 0, marginLeft: '0px', offset: 0 }),
          style({ width: '0px', opacity: 0, marginLeft: '5px', offset: 0.2 }),
          style({ width: '*', opacity: 1, marginLeft: '10px', offset: 1.0 })
        ]))
      ])
    ]),

    trigger('backgroundFade', [
      state('visible', style({
        backgroundColor: '#797ef3',
        color: 'white'
      })),
      state('hidden', style({
        backgroundColor: 'transparent',
        color: 'black'
      })),
      transition('visible => hidden', [
        animate('1500ms ease-in-out')
      ])
    ])
  ],
})
export class LogoComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private animationState = inject(AnimationStateService);
  private mobileQuery = window.matchMedia('(max-width: 700px)');
  private isMobileSignal = signal(this.mobileQuery.matches);

  logoPosition: 'center' | 'topLeft' | 'centerMobile' | 'topLeftMobile' = 'center';
  textState = 'hidden';
  backgroundState = 'visible';

  ngOnInit(): void {
    const handler = (e: MediaQueryListEvent) => this.isMobileSignal.set(e.matches);
    this.mobileQuery.addEventListener('change', handler);
    this.destroyRef.onDestroy(() => this.mobileQuery.removeEventListener('change', handler));

    const isMobile = this.isMobileSignal();
    this.logoPosition = isMobile ? 'centerMobile' : 'center';

    setTimeout(() => this.textState = 'visible', 1000);

    setTimeout(() => {
      this.logoPosition = isMobile ? 'topLeftMobile' : 'topLeft';
    }, 1800);

    setTimeout(() => this.backgroundState = 'hidden', 2400);

    setTimeout(() => this.animationState.markAsShown(), 3900);
  }
}
