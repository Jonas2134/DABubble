import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  inject, OnInit,
} from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../shared/services/user.service';
import { LoggerService } from '../../shared/services/logger.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})

export class ProfileComponent implements OnInit {
  private originalUserImage!: string;
  
  private router = inject(Router);
  private userService = inject(UserService);
  private logger = inject(LoggerService);
  isActive = true;
  showEditProfile = false;
  showAvatarChoice = false;
  editedUserName = new FormControl('');
  items = [1, 2, 3, 4, 5, 6];

  @Input() showButton = false;
  @Input() userName = '';
  @Input() userEmail = '';
  @Input() userImage = '';
  @Input() userStatus = false;
  @Input() userId = '';
  @Input() activeUserId = '';
  @Input() size: 'small' | 'big' = 'small';
  @Output() closed = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<{chatType: 'private'; chatId: string}>();
  @ViewChild('profileWrapper') profileWrapper?: ElementRef;


  ngOnInit(): void {
    this.isActive = this.userStatus;
    this.originalUserImage = this.userImage;
  }

  closeProfile() {
    this.showAvatarChoice = false;
    this.closed.emit();
  }


  async saveAvatarChange(): Promise<void> {
    try {
      await this.userService.updateUserImage(this.activeUserId, this.userImage);
      this.originalUserImage = this.userImage;
    } catch (err) {
      this.logger.error('Avatar update failed:', err);
      this.userImage = this.originalUserImage;
    } finally {
      this.showAvatarChoice = false;
    }
  }


  changeUserName() {
    const name = this.editedUserName.value?.trim();
    if (!this.activeUserId || !name) return;
    this.userService.updateUserName(this.activeUserId, name)
      .then(() => {
        this.userName = name;
        this.showEditProfile = false;
      })
      .catch(err => this.logger.error('Name update failed:', err));
  }


  onMainClick(event: MouseEvent) {
    const insideSection = this.profileWrapper?.nativeElement?.contains(
      event.target
    );
    if (!insideSection) {
      this.closed.emit();
    }
  }


  onEditClick() {
    this.showEditProfile = true;
  }


  async deleteMember() {
    if (!this.activeUserId) return;
    try {
      await this.userService.deleteUser(this.activeUserId);
      this.router.navigate(['/auth/login']);
    } catch (err) {
      this.logger.error('Account deletion failed:', err);
    }
  }


  selectAvatar(item: number): void {    
    this.userImage = `assets/img/avatar-${item}.png`;    
    this.showAvatarChoice = false;
  }


  bigUserImg(): void {
    this.showAvatarChoice = !this.showAvatarChoice;
  }

  
  trackById(index: number, id: number) {
    return id;
  }


  onStartChat() {
    this.openChat.emit({ chatType: 'private', chatId: this.userId! });
    this.closed.emit();
  }
}
