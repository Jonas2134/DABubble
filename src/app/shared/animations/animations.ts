import { trigger, transition, style, animate } from '@angular/animations';

export const fadeSlide = trigger('fadeSlide', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))
  ])
]);

export const slideUpDown = trigger('slideUpDown', [
  transition(':enter', [
    style({ transform: 'translateY(100%)', opacity: 0 }),
    animate('0.8s ease-out', style({ transform: 'translateY(0%)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('0.8s ease-out', style({ transform: 'translateY(100%)', opacity: 0 }))
  ])
]);
