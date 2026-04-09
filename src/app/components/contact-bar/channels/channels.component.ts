import { CommonModule } from '@angular/common';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { ButtonComponent } from '../../button/button.component';
import { Component, Input, EventEmitter, Output, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ChannelService } from '../../../shared/services/channel.service';
import { PermanentDeleteComponent } from '../../permanent-delete/permanent-delete.component';

@Component({
  selector: 'app-channels',
  standalone: true,
  imports: [CommonModule, AddChannelComponent, ButtonComponent, PermanentDeleteComponent],
  templateUrl: './channels.component.html',
  styleUrl: './channels.component.scss'
})

export class ChannelsComponent{
  private channelService = inject(ChannelService);
  showAddChannel = false;
  showChannels = false;
  isPermanentDeleteOpen = false;
  openChannelId: string | null = null;
  channels$: Observable<any[]> = of([]);
  @Input() activeUserId!: any;
  @Output() openChat = new EventEmitter<{ chatType: 'private' | 'channel'; chatId: string }>();
  @Output() toggleMessage = new EventEmitter<boolean>();

  ngOnInit() {
    this.loadChannels();
  }

  someAction() {
    const screenWidth = window.innerWidth;
    if (screenWidth < 1000) {
      this.toggleMessage.emit(true);
    }
  }
  
  
  loadChannels() {
    this.channels$ = this.channelService.getSortedChannels(this.activeUserId);
  }
  
  
  toggleAddChannel() {
    this.showAddChannel = !this.showAddChannel;
  }


  showAllChannels(){
    this.showChannels = !this.showChannels
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
    this.selectChannel(this.activeUserId, 'private');
  }
}

