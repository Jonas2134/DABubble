import { CommonModule } from '@angular/common';
import { AnimationEvent } from '@angular/animations';
import { Component, ElementRef, EventEmitter, HostListener, Output, Input, ViewChild, inject, effect, signal } from '@angular/core';
import { AddNewMembersComponent } from '../../../add-new-members/add-new-members.component';
import { ButtonComponent } from '../../../button/button.component';
import { ChannelService } from '../../../../shared/services/channel.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

const sectionEnter = trigger('sectionEnter', [
  transition(':enter', [
    style({ transform: 'translate(-100%, -50%)', opacity: 0 }),
    animate('0.8s ease-out', style({ transform: 'translate(-50%, -50%)', opacity: 1 }))
  ])
]);

const popupAnim = trigger('popupAnim', [
  transition('desktop => void', [
    animate('0.8s ease', style({ transform: 'translate(-150%, -50%)', opacity: 0 }))
  ]),
  transition('void => mobile', [
    style({ transform: 'translateY(100%)', opacity: 0 }),
    animate('0.8s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ]),
  transition('mobile => void', [
    animate('0.8s ease-out', style({ transform: 'translateY(100%)', opacity: 0 }))
  ])
]);

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, AddNewMembersComponent, ReactiveFormsModule, ButtonComponent],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
  animations: [sectionEnter, popupAnim],
})
export class AddChannelComponent {
  private elRef = inject(ElementRef);
  private channelService = inject(ChannelService);

  @Output() closed = new EventEmitter<void>();
  @Input() activeUserId!: string | null;

  showAddMember = true;
  channelId = '';
  channelName = new FormControl('');
  channelDescription = '';
  isMobile = window.innerWidth <= 600;
  nameExists = false;
  isVisible = true;
  private nameToCheck = signal('');
  @ViewChild('addChannel') channelWrapper?: ElementRef;
  @ViewChild('addChannelAll') memberAddWrapper?: ElementRef;

  get animMode() { return this.isMobile ? 'mobile' : 'desktop'; }

  constructor() {
    effect((onCleanup) => {
      const name = this.nameToCheck();
      if (!name) {
        this.nameExists = false;
        return;
      }
      const timeout = setTimeout(async () => {
        this.nameExists = await this.channelService.checkChannelNameExists(name);
      }, 300);
      onCleanup(() => clearTimeout(timeout));
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInside = this.elRef.nativeElement
      .querySelector('section')
      ?.contains(event.target);
    if (!clickedInside) {
      this.triggerSlideOut();
    }
  }

  triggerSlideOut() {
    if (this.showAddMember) {
      this.closed.emit();
    } else {
      this.isVisible = false;
    }
  }

  onAnimDone(event: AnimationEvent) {
    if (event.toState === 'void') {
      this.closed.emit();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 600;
  }

  closeWindow() {
    this.closed.emit();
  }

  checkNameUnique() {
    this.nameToCheck.set(this.channelName.value?.trim() ?? '');
  }

  addNewChannel(description: string) {
    const name = this.channelName.value?.trim() ?? '';
    if (!name || !this.activeUserId) return;
    this.channelDescription = description;
    this.showAddMember = false;
  }
}
