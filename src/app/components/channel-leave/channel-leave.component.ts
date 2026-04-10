import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { Channel } from '../../shared/interfaces/channel.interface';
import { User } from '../../shared/interfaces/user.interface';
import { ChannelService } from '../../shared/services/channel.service';
import { DeviceVisibleComponent } from '../device-visible/device-visible.component';
import { MemberListComponent } from '../member-list/member-list.component';
import { ProfilComponent } from '../profil/profil.component';
import { AddNewMembersComponent } from '../add-new-members/add-new-members.component';
import { fadeSlide, slideUpDown } from '../../shared/animations/animations';
import { ChannelNameEditorComponent } from './channel-name-editor/channel-name-editor.component';
import { ChannelDescriptionEditorComponent } from './channel-description-editor/channel-description-editor.component';

@Component({
  selector: 'app-channel-leave',
  standalone: true,
  imports: [
    CommonModule,
    ButtonComponent,
    DeviceVisibleComponent,
    MemberListComponent,
    ProfilComponent,
    AddNewMembersComponent,
    ChannelNameEditorComponent,
    ChannelDescriptionEditorComponent,
  ],
  templateUrl: './channel-leave.component.html',
  styleUrl: './channel-leave.component.scss',
  animations: [fadeSlide, slideUpDown],
})
export class ChannelLeaveComponent {
  private channelService = inject(ChannelService);

  @Input() channelData: Channel | null = null;
  @Input() channelMembers: User[] = [];
  @Input() activeUserId: string | null = null;
  @Input() activChannelMemberProfil: User | null = null;
  @Input() newChannelMembers: boolean = false;
  @Input() channelName: string = '';
  @Input() isChannelMemberProfilOpen: boolean = false;

  @Output() newChannelMembersChange = new EventEmitter<boolean>();
  @Output() addMember = new EventEmitter<void>();
  @Output() showProfil = new EventEmitter<User>();
  @Output() close = new EventEmitter<void>();
  @Output() nameUpdated = new EventEmitter<string>();
  @Output() openChat = new EventEmitter<{ chatType: 'private'; chatId: string }>();

  isMobile = window.innerWidth <= 600;

  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth <= 600; }

  toggleMemberProfil(member?: User) {
    this.isChannelMemberProfilOpen = !this.isChannelMemberProfilOpen;
    this.activChannelMemberProfil = member || null;
  }

  async removeMember() {
    if (!this.activeUserId || !this.channelData?.cId) return;
    await this.channelService.removeUserFromChannel(this.channelData.cId, this.activeUserId);
  }

  closeWindow() {
    this.close.emit();
  }

  closeAddMember() {
    this.newChannelMembers = false;
    this.newChannelMembersChange.emit(false);
  }
}
