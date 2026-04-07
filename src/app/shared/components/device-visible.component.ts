import { CommonModule } from '@angular/common';
import { Component, Input, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-device-visible',
  template: `<ng-container *ngIf="shouldShow"
    ><ng-content></ng-content
  ></ng-container>`,
  imports: [CommonModule],
  standalone: true,
})
export class DeviceVisibleComponent implements OnInit {
  @Input() mode:
    | 'mobileBig'
    | 'tabletBig'
    | 'desktopBig' = 'desktopBig';
  shouldShow = false;

  ngOnInit(): void {
    this.checkWidth();
  }

  @HostListener('window:resize')
  checkWidth() {
    const width = window.innerWidth;

    switch (this.mode) {
      case 'mobileBig':
        this.shouldShow = width < 600;
        break;
      case 'tabletBig':
        this.shouldShow =  width < 1000;
        break;
      case 'desktopBig':
        this.shouldShow = width > 1000;
        break;
    }
  }
}
