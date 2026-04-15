import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Message } from '../../../../shared/interfaces/message.interface';
import { GroupReactionsPipe } from '../../../../shared/pipes/group-reactions.pipe';

@Component({
  selector: 'app-message-reactions',
  standalone: true,
  imports: [GroupReactionsPipe],
  templateUrl: './message-reactions.component.html',
  styleUrl: './message-reactions.component.scss',
})
export class MessageReactionsComponent {
  @Input() message!: Message;
  @Input() activeUserId: string | null = null;

  @Output() reactionAdd = new EventEmitter<string>();
  @Output() emojiPickerToggle = new EventEmitter<MouseEvent>();

  shownReactionNumber = 7;

  setShownReactionNumber(totalCount: number) {
    this.shownReactionNumber =
      this.shownReactionNumber < totalCount ? totalCount : 7;
  }
}
