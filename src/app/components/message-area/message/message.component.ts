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
import { Timestamp } from 'firebase/firestore';
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
  lastReplyTime: Timestamp | null = null;

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
      .getUserRealtime(this.message.mSenderId)
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

    if (!this.message.mThreadId || this.chatType === 'thread') return;

    this.threadSub = this.messageService
      .getThreadMessages(this.message.mThreadId)
      .subscribe((msgs) => {
        const replies = msgs.filter((m) => m.mId !== this.message.mId);
        this.replyCount = replies.length;
        this.lastReplyTime = (replies.at(-1)?.mTime as Timestamp) ?? null;
      });
  }

  addReaction(reaction: string) {
    if (!this.message.mId || !this.activeUserId) return;

    this.userService
      .editLastReactions(this.activeUserId, reaction)
      .catch(console.error);

    this.messageService
      .toggleReaction(this.message.mId, {
        reaction,
        userId: this.activeUserId,
        userName: this.activeUserData?.uName ?? '',
      })
      .catch(console.error);
  }

  onThreadClick() {
    if (!this.message.mId) return;

    const tid = this.message.mThreadId || this.message.mId;
    const ensureThread = this.message.mThreadId
      ? Promise.resolve()
      : this.messageService.startThread(this.message.mId);

    ensureThread.then(() => {
      this.message.mThreadId = tid;
      this.threadOpen.emit(tid);
    });
  }

  openProfil() {
    if (this.message.mSenderId) this.profileClick.emit(this.message.mSenderId);
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
    this.editText = this.message.mText ?? '';
    this.toggleEdit();
    setTimeout(() => this.editTextareaRef?.nativeElement.focus());
  }

  saveEdit() {
    if (!this.message.mId) return;
    const trimmed = this.editText.trim();
    if (trimmed === (this.message.mText ?? '').trim()) {
      this.toggleEdit();
      return;
    }
    this.messageService
      .editMessageText(this.message.mId, trimmed)
      .then(() => {
        this.message.mText = trimmed;
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
