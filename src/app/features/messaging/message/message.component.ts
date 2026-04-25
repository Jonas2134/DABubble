import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  SimpleChanges,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  signal,
  DestroyRef, OnInit, OnChanges,
} from '@angular/core';
import { Message } from '../../../shared/interfaces/message.interface';
import { UserService } from '../../../shared/services/user.service';
import { MessageService } from '../../../shared/services/message.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { PermanentDeleteComponent } from '../../../ui/permanent-delete/permanent-delete.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { TimeInHoursPipe } from '../../../shared/pipes/time-in-hours.pipe';
import { DayLabelPipe } from '../../../shared/pipes/day-label.pipe';
import { MessageReactionsComponent } from './message-reactions/message-reactions.component';
import { MessageActionsComponent } from './message-actions/message-actions.component';
import { LoggerService } from '../../../shared/services/logger.service';

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
export class MessageComponent implements OnInit, OnChanges {
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);

  private cleanupThread?: () => void;
  private _currentThreadId: string | null = null;

  @Input() chatType: 'private' | 'channel' | 'thread' | 'new' | null = null;
  @Input() message!: Message;
  @Input() activeUserId: string | null = null;

  @Output() profileClick = new EventEmitter<string>();
  @Output() threadOpen = new EventEmitter<string>();

  @ViewChild('emojiPicker', { read: ElementRef }) emojiPickerRef?: ElementRef;
  @ViewChild('editTextarea', { read: ElementRef })
  editTextareaRef!: ElementRef<HTMLTextAreaElement>;

  private _senderId = signal('');
  private _activeUserId = signal<string | null>(null);

  readonly senderData = computed(() =>
    this._senderId() ? this.userService.getUserById(this._senderId()) ?? null : null
  );

  readonly activeUserData = computed(() =>
    this._activeUserId() ? this.userService.getUserById(this._activeUserId()!) ?? null : null
  );

  private elementRef = inject(ElementRef);

  editText = '';
  replyCount = 0;
  lastReplyTime: Date | string | null = null;

  isEmojiPickerOpen = false;
  isPermanentDeleteOpen = false;
  isEditOpen = false;

  emojiPickerTop = 0;
  emojiPickerLeft = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanupThread?.());
  }

  ngOnInit(): void {
    this._senderId.set(this.message.senderId);
    this._activeUserId.set(this.activeUserId);
    this.loadThreadInfo();
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['message']) {
      this._senderId.set(this.message.senderId);
      this.loadThreadInfo();
    }
    if (ch['activeUserId']) {
      this._activeUserId.set(this.activeUserId);
    }
  }

  private loadThreadInfo() {
    const threadId = this.message.threadId;

    if (!threadId || this.chatType === 'thread' || this.chatType === 'private') {
      this.cleanupThread?.();
      this._currentThreadId = null;
      this.replyCount = 0;
      this.lastReplyTime = null;
      return;
    }

    if (this._currentThreadId === threadId) return;
    this._currentThreadId = threadId;

    this.cleanupThread?.();
    this.cleanupThread = this.messageService.subscribeThreadMessages(
      threadId,
      (msgs) => {
        const replies = msgs.filter((m) => m.id !== this.message.id);
        this.replyCount = replies.length;
        this.lastReplyTime = replies.at(-1)?.createdAt ?? null;
      }
    );
  }

  addReaction(reaction: string) {
    if (!this.message.id || !this.activeUserId) return;

    this.userService
      .editLastReactions(this.activeUserId, reaction)
      .catch(err => this.logger.error('editLastReactions failed:', err));

    this.messageService
      .toggleReaction(this.message.id, {
        emoji: reaction,
        userId: this.activeUserId,
        userName: this.activeUserData()?.name ?? '',
      })
      .catch(err => this.logger.error('toggleReaction failed:', err));
  }

  private threadPending = false;

  onThreadClick() {
    if (!this.message.id || this.chatType === 'private' || this.threadPending) return;

    const tid = this.message.threadId || this.message.id;
    const ensureThread = this.message.threadId
      ? Promise.resolve()
      : (this.threadPending = true, this.messageService.startThread(this.message.id));

    ensureThread.then(() => {
      this.threadPending = false;
      this.threadOpen.emit(tid);
    });
  }

  openProfile() {
    if (this.message.senderId) this.profileClick.emit(this.message.senderId);
  }

  toggleEmojiPicker(e?: MouseEvent) {
    e?.stopPropagation();
    this.isEmojiPickerOpen = !this.isEmojiPickerOpen;
    if (this.isEmojiPickerOpen) {
      this.calcEmojiPosition();
    }
  }

  private calcEmojiPosition() {
    const section = (this.elementRef.nativeElement as HTMLElement).querySelector('section');
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const pickerH = 400;
    const pickerW = 350;
    const isOwn = this.message.senderId === this.activeUserId;
    const isThread = this.chatType === 'thread';

    let left = isThread ? rect.left + 68
      : isOwn ? rect.left + 308
      : rect.right - 266 - pickerW;

    let top = rect.bottom - pickerH;

    if (left < 0) left = 10;
    if (left + pickerW > window.innerWidth) left = window.innerWidth - pickerW - 10;
    if (top < 0) top = 10;
    if (top + pickerH > window.innerHeight) top = window.innerHeight - pickerH - 10;

    this.emojiPickerTop = top;
    this.emojiPickerLeft = left;
  }

  toggleEdit() {
    this.isEditOpen = !this.isEditOpen;
  }

  togglePermanentDelete() {
    this.isPermanentDeleteOpen = !this.isPermanentDeleteOpen;
  }

  onEmojiPicked(e: { emoji?: { native?: string } }) {
    const char = e.emoji?.native ?? '';
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
      .then(() => this.toggleEdit())
      .catch(err => this.logger.error('editMessageText failed:', err));
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
