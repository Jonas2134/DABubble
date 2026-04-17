import { CommonModule } from '@angular/common';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { ButtonComponent } from '../../../ui/button/button.component';
import { Component, Input, EventEmitter, Output, inject, computed } from '@angular/core';
import { ChannelService } from '../../../shared/services/channel.service';
import { PermanentDeleteComponent } from '../../../ui/permanent-delete/permanent-delete.component';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, AddChannelComponent, ButtonComponent, PermanentDeleteComponent],
  templateUrl: './channels.component.html',
  styleUrl: './channels.component.scss'
})
export class ChannelsComponent {
  private channelService = inject(ChannelService);

  showAddChannel = false;
  showChannels = false;
  isPermanentDeleteOpen = false;
  openChannelId: string | null = null;

  @Input() activeUserId!: string | null;
  @Input() isGuest = false;
  @Output() openChat = new EventEmitter<{ chatType: 'private' | 'channel'; chatId: string }>();
  @Output() toggleMessage = new EventEmitter<boolean>();

  readonly sortedChannels = computed(() => {
    let channels = this.channelService.channels()
      .filter(c => !this.activeUserId || c.memberIds.includes(this.activeUserId));
    if (this.isGuest) {
      channels = channels.filter(c => c.name === 'Allgemein');
    }
    return channels.map(c => ({ id: c.id!, name: c.name, createdAt: c.createdAt }));
  });

  someAction() {
    if (window.innerWidth < 1000) {
      this.toggleMessage.emit(true);
    }
  }

  toggleAddChannel() {
    this.showAddChannel = !this.showAddChannel;
  }

  showAllChannels() {
    this.showChannels = !this.showChannels;
  }

  selectChannel(channelId: string, type: 'channel' | 'private' = 'channel'): void {
    this.openChat.emit({
      chatType: `${type}`,
      chatId: channelId
    });
  }

  onDeleteClick(channelId: string, event: MouseEvent) {
    event.stopPropagation();
    this.openChannelId = channelId;
    this.isPermanentDeleteOpen = true;
    this.selectChannel(this.activeUserId!, 'private');
  }
}
