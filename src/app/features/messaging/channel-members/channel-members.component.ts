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
import { ProfilComponent } from '../../../ui/profil/profil.component';
import { AddNewMembersComponent } from '../../../ui/add-new-members/add-new-members.component';
import { MemberListComponent } from '../../../ui/member-list/member-list.component';
import { ButtonComponent } from '../../../ui/button/button.component';

@Component({
  selector: 'app-channel-members',
  imports: [
    CommonModule,
    ProfilComponent,
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
  @Input() activeChannelMemberProfil: User | null = null;
  @Input() newChannelMembers = false;
  @Input() isChannelMemberProfilOpen = false;
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


  toggleMemberProfil(member?: User) {   
    const isOpen = !this.isChannelMemberProfilOpen;
    this.isChannelMemberProfilOpen = isOpen;
    this.activeChannelMemberProfil = member || null;
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
