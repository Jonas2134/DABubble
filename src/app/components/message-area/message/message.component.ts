import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  SimpleChanges,
  ElementRef,
  HostListener,
  ViewChild,
} from '@angular/core';
import { Message } from '../../../shared/interfaces/message.interface';
import { UserService } from '../../../shared/services/user.service';
import { User } from '../../../shared/interfaces/user.interface';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../shared/services/message.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { PermanentDeleteComponent } from '../../permanent-delete/permanent-delete.component';
import { ButtonComponent } from '../../button/button.component';
import { TimeInHoursPipe } from '../../../shared/pipes/time-in-hours.pipe';
import { DayLabelPipe } from '../../../shared/pipes/day-label.pipe';
import { MessageReactionsComponent } from './message-reactions/message-reactions.component';
import { MessageActionsComponent } from './message-actions/message-actions.component';

@Component({
  selector: 'app-message',
  imports: [
    PickerComponent,
    PermanentDeleteComponent,
    ButtonComponent,
    TimeInHoursPipe,
    DayLabelPipe,
    MessageReactionsComponent,
    MessageActionsComponent,
  ],
  templateUrl: './message.component.html',
  styleUrl: './message.component.scss',
})
export class MessageComponent implements OnInit {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private userSub?: Subscription;
  private threadSub?: Subscription;
  private senderSub?: Subscription;

  @Input() chatType: 'private' | 'channel' | 'thread' | 'new' | null = null;
  @Input() message!: Message;
  @Input() activeUserId: string | null = null;

  @Output() profileClick = new EventEmitter<string>();
  @Output() threadOpen = new EventEmitter<string>();

  @ViewChild('emojiPicker', { read: ElementRef }) emojiPickerRef?: ElementRef;
  @ViewChild('editTextarea', { read: ElementRef })
  editTextareaRef!: ElementRef<HTMLTextAreaElement>;

  activeUserData: User | null = null;
  senderData: User | null = null;
  editText = '';
  replyCount = 0;
  lastReplyTime: Date | string | null = null;

  isEmojiPickerOpen = false;
  isPermanentDeleteOpen = false;
  isEditOpen = false;

  ngOnInit(): void {
    this.loadSenderData();
    this.loadActiveUserData();
    this.loadThreadInfo();
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['message']) {
      this.loadThreadInfo();
    }
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.threadSub?.unsubscribe();
    this.senderSub?.unsubscribe();
  }

  private loadSenderData() {
    this.senderSub?.unsubscribe();
    this.senderSub = this.userService
      .getUserRealtime(this.message.senderId)
      .subscribe({
        next: (u) => (this.senderData = u),
        error: (err) => console.error('Sender-Live', err),
      });
  }

  private loadActiveUserData() {
    if (!this.activeUserId) return;
    this.userSub?.unsubscribe();
    this.userSub = this.userService
      .getUserRealtime(this.activeUserId)
      .subscribe({
        next: (u) => (this.activeUserData = u),
        error: (err) => console.error('User-Live', err),
      });
  }

  private loadThreadInfo() {
    this.threadSub?.unsubscribe();
    this.replyCount = 0;
    this.lastReplyTime = null;

    if (!this.message.threadId || this.chatType === 'thread') return;

    this.threadSub = this.messageService
      .getThreadMessages(this.message.threadId)
      .subscribe((msgs) => {
        const replies = msgs.filter((m) => m.id !== this.message.id);
        this.replyCount = replies.length;
        this.lastReplyTime = replies.at(-1)?.createdAt ?? null;
      });
  }

  addReaction(reaction: string) {
    if (!this.message.id || !this.activeUserId) return;

    this.userService
      .editLastReactions(this.activeUserId, reaction)
      .catch(console.error);

    this.messageService
      .toggleReaction(this.message.id, {
        emoji: reaction,
        userId: this.activeUserId,
        userName: this.activeUserData?.name ?? '',
      })
      .catch(console.error);
  }

  onThreadClick() {
    if (!this.message.id) return;

    const tid = this.message.threadId || this.message.id;
    const ensureThread = this.message.threadId
      ? Promise.resolve()
      : this.messageService.startThread(this.message.id);

    ensureThread.then(() => {
      this.message.threadId = tid;
      this.threadOpen.emit(tid);
    });
  }

  openProfil() {
    if (this.message.senderId) this.profileClick.emit(this.message.senderId);
  }

  toggleEmojiPicker(e?: MouseEvent) {
    e?.stopPropagation();
    this.isEmojiPickerOpen = !this.isEmojiPickerOpen;
  }

  toggleEdit() {
    this.isEditOpen = !this.isEditOpen;
  }

  togglePermanentDelete() {
    this.isPermanentDeleteOpen = !this.isPermanentDeleteOpen;
  }

  onEmojiPicked(e: any) {
    const char = e.emoji?.native ?? e.emoji;
    if (this.isEditOpen && this.editTextareaRef) {
      const ta = this.editTextareaRef.nativeElement;
      const pos = ta.selectionStart ?? this.editText.length;
      this.editText =
        this.editText.slice(0, pos) + char + this.editText.slice(pos);
      setTimeout(() =>
        ta.setSelectionRange(pos + char.length, pos + char.length)
      );
      return;
    }
    this.addReaction(char);
    this.isEmojiPickerOpen = false;
  }

  onEditTextInput(event: Event) {
    this.editText = (event.target as HTMLTextAreaElement).value;
  }

  openEdit() {
    this.editText = this.message.text ?? '';
    this.toggleEdit();
    setTimeout(() => this.editTextareaRef?.nativeElement.focus());
  }

  saveEdit() {
    if (!this.message.id) return;
    const trimmed = this.editText.trim();
    if (trimmed === (this.message.text ?? '').trim()) {
      this.toggleEdit();
      return;
    }
    this.messageService
      .editMessageText(this.message.id, trimmed)
      .then(() => {
        this.message.text = trimmed;
        this.toggleEdit();
      })
      .catch(console.error);
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(ev: MouseEvent): void {
    if (this.isPermanentDeleteOpen) return;
    const target = ev.target as HTMLElement;
    if (
      this.isEmojiPickerOpen &&
      !this.emojiPickerRef?.nativeElement?.contains(target)
    ) {
      this.isEmojiPickerOpen = false;
    }
  }
}
