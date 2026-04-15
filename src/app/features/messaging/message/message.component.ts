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

  private cleanupThread?: () => void;

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

  editText = '';
  replyCount = 0;
  lastReplyTime: Date | string | null = null;

  isEmojiPickerOpen = false;
  isPermanentDeleteOpen = false;
  isEditOpen = false;

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
    this.cleanupThread?.();
    this.replyCount = 0;
    this.lastReplyTime = null;

    if (!this.message.threadId || this.chatType === 'thread') return;

    this.cleanupThread = this.messageService.subscribeThreadMessages(
      this.message.threadId,
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
      .catch(console.error);

    this.messageService
      .toggleReaction(this.message.id, {
        emoji: reaction,
        userId: this.activeUserId,
        userName: this.activeUserData()?.name ?? '',
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
