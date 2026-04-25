import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { User } from '../../../shared/interfaces/user.interface';
import { ProfileComponent } from '../../../ui/profile/profile.component';
import { AddNewMembersComponent } from '../../../ui/add-new-members/add-new-members.component';
import { MemberListComponent } from '../../../ui/member-list/member-list.component';
import { ButtonComponent } from '../../../ui/button/button.component';

@Component({
  selector: 'app-channel-members',
  imports: [
    CommonModule,
    ProfileComponent,
    AddNewMembersComponent,
    MemberListComponent,
    ButtonComponent,
  ],
  templateUrl: './channel-members.component.html',
  styleUrl: './channel-members.component.scss',
})

export class ChannelMembersComponent{
  @Input() channelMembers: User[] = [];
  @Input() activeUserId: string | null = null;
  @Input() channelId = '';
  @Input() channelName = '';
  activeChannelMemberProfile: User | null = null;
  @Input() newChannelMembers = false;
  isChannelMemberProfileOpen = false;
  @Output() newChannelMembersChange = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<{chatType: 'private'; chatId: string}>();
  @ViewChild('channelWrapper') channelWrapper?: ElementRef;
  @ViewChild('memberAddWrapper') memberAddWrapper?: ElementRef;

  
  closeChannelMembers() { 
    this.closed.emit();
  }


  onOverlayClick(event: MouseEvent) {
    const target = event.target as Node;
    if (this.newChannelMembers) {
      if (this.memberAddWrapper && !this.memberAddWrapper.nativeElement.contains(target)) {
        this.closeAddMembers();
      }
    } else {
      if (this.channelWrapper && !this.channelWrapper.nativeElement.contains(target)) {
        this.closeChannelMembers();
      }
    }
  }


  toggleMemberProfile(member?: User) {   
    const isOpen = !this.isChannelMemberProfileOpen;
    this.isChannelMemberProfileOpen = isOpen;
    this.activeChannelMemberProfile = member || null;
  }


  closeAddMembers() {
    this.newChannelMembers = false;
    this.newChannelMembersChange.emit(false);
  }

  
  addChannelMember() {
    this.newChannelMembers = true;
    this.newChannelMembersChange.emit(true);
  }
}
