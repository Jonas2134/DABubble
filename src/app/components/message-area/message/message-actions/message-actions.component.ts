import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { Message } from '../../../../shared/interfaces/message.interface';
import { User } from '../../../../shared/interfaces/user.interface';

@Component({
  selector: 'app-message-actions',
  standalone: true,
  templateUrl: './message-actions.component.html',
  styleUrl: './message-actions.component.scss',
})
export class MessageActionsComponent {
  @Input() message!: Message;
  @Input() activeUserId: string | null = null;
  @Input() chatType: 'private' | 'channel' | 'thread' | 'new' | null = null;
  @Input() activeUserData: User | null = null;

  @Output() reactionAdd = new EventEmitter<string>();
  @Output() emojiPickerToggle = new EventEmitter<MouseEvent>();
  @Output() threadOpen = new EventEmitter<void>();
  @Output() editOpen = new EventEmitter<void>();
  @Output() deleteOpen = new EventEmitter<void>();

  @ViewChild('optionsMenu', { read: ElementRef }) optionsMenuRef?: ElementRef;
  @ViewChild('optionsBtn', { read: ElementRef }) optionsBtnRef?: ElementRef;

  isOptionsOpen = false;

  toggleOptions(e: MouseEvent) {
    e.stopPropagation();
    this.isOptionsOpen = !this.isOptionsOpen;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(ev: MouseEvent): void {
    if (
      this.isOptionsOpen &&
      !this.optionsMenuRef?.nativeElement?.contains(ev.target) &&
      !this.optionsBtnRef?.nativeElement?.contains(ev.target)
    ) {
      this.isOptionsOpen = false;
    }
  }
}
