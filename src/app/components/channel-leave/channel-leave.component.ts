import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject} from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { Channel } from '../../shared/interfaces/channel.interface';
import { Firestore} from '@angular/fire/firestore';
import {map, takeUntil } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../shared/services/user.service';
import { User } from '../../shared/interfaces/user.interface';
import { ChannelService } from '../../shared/services/channel.service';
import { DeviceVisibleComponent } from '../device-visible/device-visible.component';
import { MemberListComponent } from '../member-list/member-list.component';
import { ProfilComponent } from '../profil/profil.component';
import { AddNewMembersComponent } from '../add-new-members/add-new-members.component';
import { Subject } from 'rxjs';
import { fadeSlide, slideUpDown } from '../../shared/animations/animations';

@Component({
  selector: 'app-channel-leave',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ReactiveFormsModule, DeviceVisibleComponent, MemberListComponent, ProfilComponent, AddNewMembersComponent],
  templateUrl: './channel-leave.component.html',
  styleUrl: './channel-leave.component.scss',
  animations: [fadeSlide, slideUpDown],
})

export class ChannelLeaveComponent implements OnInit{
  firestore = inject(Firestore);
  private userService = inject(UserService);
  private channelService = inject(ChannelService);
  @Input() channelData: Channel | null = null;
  @Input() channelMembers:  User[] = [];
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
  @Output() openChat = new EventEmitter<{chatType: 'private'; chatId: string}>();

  private destroy$ = new Subject<void>();
  channelNameSave: boolean = false;
  descriptionSave: boolean = false;
  editedChannelName = new FormControl('');
  editMode: boolean = true;
  hasInteractedName: boolean = false;
  editDescription: boolean = true;
  editedDescription = new FormControl('');
  hasInteracted: boolean = false;
  isMobile = window.innerWidth <= 600;
  nameExists = false;
  createdByUserName: string = 'Unbekannt';



  ngOnInit(): void {
    this.userService.getEveryUsers()
      .pipe(
        map(users => users.find(u => u.uId === this.channelData?.cCreatedByUser)),
        takeUntil(this.destroy$)
      )
      .subscribe(user => {
        if (user) {
          this.createdByUserName = user.uName;
        }
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  async onNameInput() {
    const trimmed = this.editedChannelName.value?.trim() ?? '';
    if (trimmed.length < 3 || trimmed === this.channelData?.cName) {
      this.nameExists = false;
      return;
    }
    try {
      this.nameExists = await this.channelService.checkChannelNameExists(trimmed);
    } catch (err) {
      this.nameExists = false;
    }
  }


  toggleMemberProfil(member?: User) {
    const isOpen = !this.isChannelMemberProfilOpen;
    this.isChannelMemberProfilOpen = isOpen;
    this.activChannelMemberProfil = member || null;
  }


  @HostListener('window:resize')
  onResize() { this.isMobile = window.innerWidth <= 600; }

  toggleEdit() {
    this.hasInteractedName = true;
    this.editMode = !this.editMode;
    if (this.editMode && this.channelData?.cName) {
      this.editedChannelName.setValue(this.channelData.cName);
    }
  }


  toggleDescription() {
    this.hasInteracted = true;
    this.editDescription = !this.editDescription;
    if (this.editDescription && this.channelData?.cDescription) {
      this.editedDescription.setValue(this.channelData.cDescription);
    }
  }


  async removeMember() {
    if (!this.activeUserId || !this.channelData?.cId) return;
    await this.channelService.removeUserFromChannel(
      this.channelData?.cId,
      this.activeUserId
    );
  }


  closeWindow() {  
    this.close.emit();
  }


  saveNewName() {
    const newName = this.editedChannelName.value?.trim() ?? '';
    if (!newName || newName.length < 3 || this.nameExists || !this.channelData?.cId) {
      return;
    }
    this.channelService
      .updateChannelName(this.channelData.cId, newName)
      .then(() => {
        this.channelData!.cName = newName;
        this.nameUpdated.emit(newName);
        this.toggleEdit();
      })
      .catch();
  }

  
  saveDescription() {
    const newDesc = this.editedDescription.value?.trim() ?? '';
    if (!newDesc || !this.channelData?.cId) return;
    this.channelService.updateChannelDescription(this.channelData.cId, newDesc)
      .then(() => {
        this.channelData!.cDescription = newDesc;
      })
      .catch(() => {});
  }


  closeAddMember() {
    this.newChannelMembers = false;
    this.newChannelMembersChange.emit(false);
  }
}
