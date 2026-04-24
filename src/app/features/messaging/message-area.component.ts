import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
  computed,
  DestroyRef, AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../shared/services/message.service';
import { UserService } from '../../shared/services/user.service';
import { ChannelService } from '../../shared/services/channel.service';
import { AuthentificationService } from '../../shared/services/authentification.service';
import { DateFormatService } from '../../shared/services/date-format.service';
import { Message } from '../../shared/interfaces/message.interface';
import { User } from '../../shared/interfaces/user.interface';
import { Channel } from '../../shared/interfaces/channel.interface';
import { ButtonComponent } from '../../ui/button/button.component';
import { MessageComponent } from './message/message.component';
import { ChannelLeaveComponent } from '../channel/channel-leave.component';
import { ProfilComponent } from '../../ui/profil/profil.component';
import { ChannelMembersComponent } from './channel-members/channel-members.component';
import { AddNewMembersComponent } from '../../ui/add-new-members/add-new-members.component';
import { MessageComposerComponent } from './message-composer/message-composer.component';
import { DateStringPipe } from '../../shared/pipes/date-string.pipe';

@Component({
  selector: 'app-message-area',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    MessageComponent,
    ChannelLeaveComponent,
    ProfilComponent,
    ChannelMembersComponent,
    AddNewMembersComponent,
    MessageComposerComponent,
    DateStringPipe,
  ],
  templateUrl: './message-area.component.html',
  styleUrls: ['./message-area.component.scss'],
})
export class MessageAreaComponent implements OnChanges, AfterViewInit {
  private userService = inject(UserService);
  private channelService = inject(ChannelService);
  private messageService = inject(MessageService);
  private dateFormat = inject(DateFormatService);
  private authService = inject(AuthentificationService);
  private destroyRef = inject(DestroyRef);

  readonly isGuest = this.authService.isGuest;

  private cleanupMessages?: () => void;

  @Input() chatType: 'private' | 'channel' | 'thread' | 'new' = 'private';
  @Input() chatId: string | null = null;
  @Input() activeUserId: string | null = null;

  @Output() openThread = new EventEmitter<string>();
  @Output() closeThread = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<{
    chatType: 'private' | 'channel';
    chatId: string;
  }>();

  @ViewChild('scrollContainer') private scrollCont!: ElementRef<HTMLDivElement>;
  @ViewChild('composer') private composerRef?: MessageComposerComponent;

  private _chatId = signal<string | null>(null);
  private _chatType = signal<string>('private');

  readonly chatPartner = computed(() => {
    if (this._chatType() !== 'private' || !this._chatId()) return null;
    return this.userService.getUserById(this._chatId()!) ?? null;
  });

  readonly channelData = computed(() => {
    if (this._chatType() !== 'channel' || !this._chatId()) return null;
    return this.channelService.getChannelById(this._chatId()!) ?? null;
  });

  readonly channelMembers = computed(() => {
    const ch = this.channelData();
    if (!ch?.memberIds?.length) return [];
    const members = ch.memberIds
      .map(id => this.userService.getUserById(id))
      .filter((u): u is User => !!u);
    const uid = this.activeUserId;
    return members.sort((a, b) => {
      if (a.id === uid) return -1;
      if (b.id === uid) return 1;
      return 0;
    });
  });

  isLoading = true;
  isEditChannelOpen = false;
  isProfilOpen = false;
  isChannelMemberOpen = false;
  messages = signal<Message[]>([]);
  userProfil: User | null = null;
  threadContextName = '';
  threadReplyCount = 0;
  showNewSuggestions = false;
  foundUsersNew: User[] = [];
  foundChannelsNew: Channel[] = [];
  newChatInput = '';
  newChannelMembers = false;
  addMemberPopUp = false;

  constructor() {
    this.destroyRef.onDestroy(() => this.cleanupMessages?.());
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isLoading = false;
      this.scrollToBottom();
      this.composerRef?.focus();
    }, 500);
  }

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['chatType'] || ch['chatId'] || ch['activeUserId']) {
      this._chatType.set(this.chatType);
      this._chatId.set(this.chatId);
      this.isChannelMemberOpen = false;
      this.prepareForReload();
      this.loadMessages();
      setTimeout(() => this.composerRef?.focus(), 500);
    }
  }

  private prepareForReload() {
    this.isLoading = true;
    setTimeout(() => (this.isLoading = false), 500);
  }

  private loadMessages() {
    this.cleanupMessages?.();

    if (!this.chatType || !this.chatId || !this.activeUserId) {
      this.resetMessages();
      return;
    }

    this.cleanupMessages = this.messageService.subscribeMessages(
      this.chatType, this.chatId, this.activeUserId,
      (msgs) => this.handleIncomingMessages(msgs)
    );
  }

  private resetMessages() {
    this.messages.set([]);
    this.threadReplyCount = 0;
  }

  private handleIncomingMessages(msgs: Message[]) {
    const current = this.messages();
    const initial = current.length === 0;
    const more = msgs.length > current.length;
    this.messages.set(msgs);

    if (this.chatType === 'thread') {
      this.threadReplyCount = Math.max(0, msgs.length - 1);
      if (msgs.length > 0) {
        this.setThreadContextName(msgs[0]);
      }
    }

    if (more) setTimeout(() => this.scrollToBottom(), 100);
    if (initial) setTimeout(() => this.composerRef?.focus(), 0);
  }

  private setThreadContextName(parent: Message) {
    if (parent.channelId) {
      const ch = this.channelService.getChannelById(parent.channelId);
      if (ch) this.threadContextName = `#${ch.name}`;
    } else if (parent.userId) {
      const u = this.userService.getUserById(parent.userId);
      if (u) this.threadContextName = `@${u.name}`;
    }
  }

  private scrollToBottom() {
    if (this.scrollCont)
      this.scrollCont.nativeElement.scrollTop =
        this.scrollCont.nativeElement.scrollHeight;
  }

  handleThreadClick(id: string) {
    this.openThread.emit(id);
  }
  handleCloseThread() {
    this.closeThread.emit();
  }

  toggleEdit() {
    this.isEditChannelOpen = !this.isEditChannelOpen;
  }

  toggleProfile(u: User | null) {
    this.userProfil = u;
    this.isProfilOpen = !this.isProfilOpen;
  }

  openUserProfil(id: string) {
    this.userProfil = this.userService.getUserById(id) ?? null;
    this.isProfilOpen = true;
  }

  toggleChannelMembers() {
    this.isChannelMemberOpen = !this.isChannelMemberOpen;
  }

  addChannelMember() {
    this.newChannelMembers = true;
  }
  openAddMemberPopUp() {
    this.addMemberPopUp = true;
  }
  closeAddMember() {
    this.addMemberPopUp = false;
  }

  onNewInputChange(event: Event) {
    this.newChatInput = (event.target as HTMLInputElement).value;
    const val = this.newChatInput.trim();
    this.showNewSuggestions = !!val;

    if (!val) {
      this.foundUsersNew = [];
      this.foundChannelsNew = [];
      return;
    }

    const first = val.charAt(0);
    const query = val.slice(1).toLowerCase();

    if (first === '@') {
      this.foundUsersNew = this.userService.users().filter(u =>
        u.name.toLowerCase().includes(query)
      );
      this.foundChannelsNew = [];
    } else if (first === '#') {
      this.foundChannelsNew = this.channelService.channels().filter(c =>
        c.name.toLowerCase().includes(query)
      );
      this.foundUsersNew = [];
    } else {
      this.foundUsersNew = this.userService.users().filter(u =>
        u.email.toLowerCase().includes(val.toLowerCase())
      );
      this.foundChannelsNew = [];
    }
  }

  selectUserNew(u: User) {
    this.finishNewTarget('private', u.id);
  }
  selectChannelNew(c: Channel) {
    this.finishNewTarget('channel', c.id);
  }

  private finishNewTarget(type: 'private' | 'channel', id: string) {
    this.newChatInput = '';
    this.showNewSuggestions = false;
    this.openChat.emit({ chatType: type, chatId: id });
  }

  sendMessageFromComposer(text: string) {
    this.newMessageText = text;
    this.sendMessage();
  }

  private newMessageText = '';

  private async sendMessage() {
    const txt = this.newMessageText.trim();
    if (!txt || !this.activeUserId) return;

    if (this.chatType === 'thread' && this.chatId) {
      await this.messageService.replyInThread(
        this.chatId,
        txt,
        this.activeUserId
      );
    } else if (this.chatId) {
      const msg: Partial<Message> = {
        text: txt,
        reactions: [],
        senderId: this.activeUserId,
        userId: this.chatType === 'private' ? this.chatId : '',
        channelId: this.chatType === 'channel' ? this.chatId : '',
        threadId: '',
      };
      await this.messageService.createMessage(msg);
    }
    this.newMessageText = '';
    setTimeout(() => this.scrollToBottom(), 1000);
  }

  shouldShowDateSeparator(i: number): boolean {
    if (i === 0) return true;
    const msgs = this.messages();
    return (
      this.dateFormat.getDay(msgs[i].createdAt) !==
      this.dateFormat.getDay(msgs[i - 1].createdAt)
    );
  }

  getPlaceholder(): string {
    switch (this.chatType) {
      case 'private':
        return `Nachricht an ${this.chatPartner()?.name || 'unbekannter User'}`;
      case 'channel':
        return `Nachricht an #${this.channelData()?.name || 'unbekannter Kanal'}`;
      case 'thread':
        return 'Antworten...';
      default:
        return 'Starte eine neue Nachricht';
    }
  }

  onAvatarError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (!img.dataset['fallback']) {
      img.dataset['fallback'] = 'true';
      img.src = 'assets/img/profile.png';
    }
  }
}
