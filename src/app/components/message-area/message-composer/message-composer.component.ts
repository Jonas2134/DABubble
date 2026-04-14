import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiEvent } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { ButtonComponent } from '../../button/button.component';

import { UserService } from '../../../shared/services/user.service';
import { ChannelService } from '../../../shared/services/channel.service';
import { User } from '../../../shared/interfaces/user.interface';
import { Channel } from '../../../shared/interfaces/channel.interface';

@Component({
  selector: 'app-message-composer',
  standalone: true,
  imports: [CommonModule, PickerComponent, ButtonComponent],
  templateUrl: './message-composer.component.html',
  styleUrls: ['./message-composer.component.scss'],
})
export class MessageComposerComponent {
  @Input() placeholder = 'Nachricht schreiben …';

  @Output() messageSend = new EventEmitter<string>();

  @ViewChild('emojiPicker', { read: ElementRef }) emojiPickerRef?: ElementRef;
  @ViewChild('emojiButton', { read: ElementRef }) emojiButtonRef?: ElementRef;
  @ViewChild('messageInput') messageInputRef!: ElementRef<HTMLTextAreaElement>;

  isEmojiPickerOpen = false;

  displaySuggestions = false;
  foundUsers: User[] = [];
  foundChannels: Channel[] = [];
  currentMentionPos = -1;

  newMessageText = '';

  private userService = inject(UserService);
  private channelService = inject(ChannelService);

  focus(): void {
    setTimeout(() => this.messageInputRef?.nativeElement.focus());
  }

  handleKeyDown(event: KeyboardEvent) {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      this.newMessageText.trim()
    ) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  onTextChange(event: Event) {
    const txtArea = event.target as HTMLTextAreaElement;
    this.newMessageText = txtArea.value;
    const caretPos = txtArea.selectionStart || 0;
    const message = txtArea.value;

    const atPos = message.lastIndexOf('@');
    const hashPos = message.lastIndexOf('#');
    const mentionPos = Math.max(atPos, hashPos);

    this.currentMentionPos =
      mentionPos !== -1 && mentionPos < caretPos ? mentionPos : -1;

    if (this.currentMentionPos === -1) {
      this.hideSuggestions();
      return;
    }

    const mentionText = message.slice(mentionPos + 1, caretPos);

    if (mentionText.includes(' ')) {
      this.hideSuggestions();
      return;
    }

    if (message[mentionPos] === '@') {
      this.searchUsers(mentionText);
    } else {
      this.searchChannels(mentionText);
    }
  }

  private searchUsers(input: string) {
    this.foundUsers = this.userService.users().filter((u) =>
      u.name.toLowerCase().includes(input.toLowerCase())
    );
    this.foundChannels = [];
    this.displaySuggestions = this.foundUsers.length > 0;
  }

  private searchChannels(input: string) {
    this.foundChannels = this.channelService.channels().filter((c) =>
      c.name.toLowerCase().includes(input.toLowerCase())
    );
    this.foundUsers = [];
    this.displaySuggestions = this.foundChannels.length > 0;
  }

  openUserSuggestions() {
    const ta = this.messageInputRef?.nativeElement;
    if (!ta) return;

    const caretPos = ta.selectionStart || 0;
    this.newMessageText =
      this.newMessageText.slice(0, caretPos) +
      '@' +
      this.newMessageText.slice(caretPos);

    ta.value = this.newMessageText;
    ta.setSelectionRange(caretPos + 1, caretPos + 1);

    this.currentMentionPos = caretPos;
    this.searchUsers('');
  }

  insertUserSuggestion(user: User) {
    if (user?.name) this.insertSuggestion(user.name);
  }
  insertChannelSuggestion(ch: Channel) {
    if (ch?.name) this.insertSuggestion(ch.name);
  }

  private insertSuggestion(text: string) {
    const ta = this.messageInputRef?.nativeElement;
    if (!ta || this.currentMentionPos === -1) return;

    const caretPos = ta.selectionStart;
    const newText =
      this.newMessageText.slice(0, this.currentMentionPos + 1) +
      text +
      ' ' +
      this.newMessageText.slice(caretPos);

    this.newMessageText = newText;
    ta.value = newText;

    const newCaret = this.currentMentionPos + 1 + text.length + 1;
    ta.setSelectionRange(newCaret, newCaret);
    ta.focus();
    this.hideSuggestions();
  }

  private hideSuggestions() {
    this.displaySuggestions = false;
    this.foundUsers = [];
    this.foundChannels = [];
  }

  toggleEmojiPicker(event?: MouseEvent) {
    event?.stopPropagation();
    this.isEmojiPickerOpen = !this.isEmojiPickerOpen;

    if (this.isEmojiPickerOpen) {
      setTimeout(() => this.emojiPickerRef?.nativeElement.focus?.());
    }
  }

  addEmoji(emoji: EmojiEvent) {
    const char = emoji.emoji.native;
    if (!char) return;
    const ta = this.messageInputRef.nativeElement;
    const pos = ta.selectionStart;

    this.newMessageText =
      this.newMessageText.slice(0, pos) + char + this.newMessageText.slice(pos);

    ta.value = this.newMessageText;
    ta.setSelectionRange(pos + char.length, pos + char.length);
    ta.focus();
    this.isEmojiPickerOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closePickerOnOutside(event: MouseEvent) {
    if (!this.isEmojiPickerOpen) return;
    const target = event.target as HTMLElement;
    const insidePicker = this.emojiPickerRef?.nativeElement.contains(target);
    const onIcon = this.emojiButtonRef?.nativeElement.contains(target);
    if (!insidePicker && !onIcon) this.isEmojiPickerOpen = false;
  }

  sendMessage() {
    const trimmed = this.newMessageText.trim();
    if (!trimmed) return;
    this.messageSend.emit(trimmed);
    this.newMessageText = '';
    this.hideSuggestions();
  }

  getPlaceholder(): string {
    return this.placeholder;
  }
}
