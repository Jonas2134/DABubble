import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, computed } from '@angular/core';
import { User } from '../../../shared/interfaces/user.interface';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss',
})
export class DirectMessageComponent {
  private userService = inject(UserService);

  showMessages = false;

  @Input() activeUserId!: string | null;
  @Output() openChat = new EventEmitter<{ chatType: 'private' | 'channel'; chatId: string }>();
  @Output() toggleMessage = new EventEmitter<boolean>();

  readonly activeUsers = computed(() =>
    this.userService.users().filter(user => user.id === this.activeUserId)
  );

  readonly inactiveUsers = computed(() =>
    this.userService.users().filter(user => user.id !== this.activeUserId)
  );

  readonly activeUser = computed(() =>
    this.userService.users().find(user => user.id === this.activeUserId)
  );

  someAction() {
    if (window.innerWidth < 1000) {
      this.toggleMessage.emit(true);
    }
  }

  showAllMessages() {
    this.showMessages = !this.showMessages;
  }

  selectPrivateChat(userId: string) {
    this.openChat.emit({
      chatType: 'private',
      chatId: userId,
    });
  }
}
