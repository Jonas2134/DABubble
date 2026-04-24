import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from '../../shared/interfaces/user.interface';
import { ChannelService } from '../../shared/services/channel.service';
import { MessageService } from '../../shared/services/message.service';
import { UserService } from '../../shared/services/user.service';
import { Message } from '../../shared/interfaces/message.interface';
import { Channel } from '../../shared/interfaces/channel.interface';

interface ChannelMessage {
  text: string;
  channelName: string;
  channelId: string;
}

interface DirectMessage {
  text: string;
  otherUserId: string;
  otherUserName: string;
}

interface ThreadHit {
  text: string;
  threadId: string;
  chatId: string;
  chatType: 'channel' | 'private';
}

@Component({
  selector: 'app-search-information',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-information.component.html',
  styleUrl: './search-information.component.scss',
})
export class SearchInformationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private channelService = inject(ChannelService);

  private _searchText = '';

  @Input() set searchText(value: string) {
    this._searchText = value.trim().toLowerCase();
    this.handleSearch(this._searchText);
  }

  @Output() closed = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<{
    chatType: 'private' | 'channel' | 'new';
    chatId: string;
  }>();
  @Output() openThread = new EventEmitter<{
    chatType: 'channel' | 'private';
    chatId: string;
    threadId: string;
  }>();

  activeUserId: string | null = null;
  users: User[] = [];
  channelsWithNames: { name: string; id: string | null | undefined; memberNames: string[] }[] = [];

  matchedMessages: ChannelMessage[] = [];
  directMessages: DirectMessage[] = [];
  threadMessages: ThreadHit[] = [];

  showContact = true;
  showChannels = true;
  showMatchedMessages = true;
  showDirectMessages = true;
  showThreadMessages = true;

  ngOnInit(): void {
    this.activeUserId = this.route.snapshot.paramMap.get('activeUserId');
  }

  private async handleSearch(searchText: string) {
    if (!searchText || searchText.length < 3) return;

    const users = this.userService.users();
    const channels = this.channelService.channels();
    let messages: Message[];
    try {
      messages = await this.messageService.getAllMessages();
    } catch {
      messages = [];
    }

    this.users = this.filterUsers(users, searchText);
    this.channelsWithNames = this.filterChannels(channels, users, searchText);
    this.matchedMessages = this.findChannelMsgs(messages, channels, searchText);
    this.directMessages = this.findDirectMsgs(messages, users, searchText);
    this.threadMessages = this.findThreadMsgs(messages, searchText);

    this.updateVisibilityFlags();
  }

  private filterUsers(users: User[], q: string): User[] {
    return users.filter((u) => (u.name || '').toLowerCase().includes(q));
  }

  private filterChannels(channels: Channel[], users: User[], q: string) {
    return channels
      .filter((ch) => (ch.name || '').toLowerCase().includes(q))
      .map((ch) => ({
        name: ch.name,
        id: ch.id ?? null,
        memberNames: users
          .filter((u) => (ch.memberIds || []).includes(u.id))
          .map((u) => u.name),
      }));
  }

  private findChannelMsgs(msgs: Message[], channels: Channel[], q: string) {
    return msgs
      .filter(
        (m) =>
          typeof m.channelId === 'string' &&
          m.channelId.trim() &&
          m.text.toLowerCase().includes(q)
      )
      .map((m) => {
        const ch = channels.find((c) => c.id === m.channelId);
        return {
          text: m.text,
          channelName: ch?.name || '',
          channelId: ch?.id || '',
        };
      });
  }

  private findDirectMsgs(msgs: Message[], users: User[], q: string) {
    return msgs
      .filter(
        (m) =>
          m.text.toLowerCase().includes(q) &&
          (m.userId === this.activeUserId ||
            m.senderId === this.activeUserId) &&
          typeof m.userId === 'string' &&
          m.userId.trim()
      )
      .map((m) => {
        const otherId =
          m.userId === this.activeUserId ? m.senderId : m.userId!;
        const otherUser = users.find((u) => u.id === otherId);
        return {
          text: m.text,
          otherUserId: otherId,
          otherUserName: otherUser?.name || '',
        };
      });
  }

  private findThreadMsgs(msgs: Message[], q: string) {
    const hits: ThreadHit[] = [];
    for (const m of msgs) {
      if (!this.isThreadHit(m, q)) continue;
      const parent = msgs.find((x) => x.id === m.threadId);
      if (!parent) continue;
      const chatType = parent.channelId ? 'channel' : 'private';
      const chatId =
        parent.channelId ??
        (parent.userId === this.activeUserId
          ? parent.senderId
          : parent.userId!) ??
        '';
      hits.push({ text: m.text, threadId: m.threadId!, chatId, chatType });
    }
    return hits;
  }

  private isThreadHit(m: Message, q: string) {
    return (
      typeof m.threadId === 'string' &&
      m.threadId.trim() &&
      m.text.toLowerCase().includes(q)
    );
  }

  private updateVisibilityFlags() {
    this.showContact = !this.users.length;
    this.showChannels = !this.channelsWithNames.length;
    this.showMatchedMessages = !this.matchedMessages.length;
    this.showDirectMessages = !this.directMessages.length;
    this.showThreadMessages = !this.threadMessages.length;
  }

  selectChat(chatId: string, chatType: 'private' | 'channel') {
    this.openChat.emit({ chatType, chatId });
    this.closed.emit();
  }

  selectThread(hit: ThreadHit) {
    this.openThread.emit({
      chatType: hit.chatType,
      chatId: hit.chatId,
      threadId: hit.threadId,
    });
    this.closed.emit();
  }
}
