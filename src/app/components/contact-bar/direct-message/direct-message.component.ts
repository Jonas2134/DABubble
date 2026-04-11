import { CommonModule } from '@angular/common';
import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../../../shared/interfaces/user.interface';
import { UserService } from '../../../shared/services/user.service';

@Component({
  selector: 'app-direct-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './direct-message.component.html',
  styleUrl: './direct-message.component.scss',
})

export class DirectMessageComponent implements OnInit {
  private userService = inject(UserService);
  showMessages = false;
  activeUser?: User;
  activeUsers$!: Observable<any[]>;
  inactiveUsers$!: Observable<any[]>;
  @Input() activeUserId!: string | null;
  @Output() openChat = new EventEmitter<{ chatType: 'private' | 'channel'; chatId: string }>();
  @Output() toggleMessage = new EventEmitter<boolean>();

  someAction() {
    const screenWidth = window.innerWidth;

    if (screenWidth < 1000) {
      this.toggleMessage.emit(true);
    }
  }


  ngOnInit(): void {
    if (this.activeUserId) {
      this.loadUsers();
  
    }
  }



  loadUsers(): void {
    const users$ = this.userService.getEveryUsers();
    this.activeUsers$ = users$.pipe(
      map(users => users.filter(user => user.id === this.activeUserId))
    );
    this.inactiveUsers$ = users$.pipe(
      map(users => users.filter(user => user.id !== this.activeUserId))
    );
    users$.subscribe(users => {
      this.activeUser = users.find(user => user.id === this.activeUserId);
    });
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
