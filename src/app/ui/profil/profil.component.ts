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

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ReactiveFormsModule],
  templateUrl: './profil.component.html',
  styleUrl: './profil.component.scss',
})

export class ProfilComponent implements OnInit {
  private originalUserImage!: string;
  
  private router = inject(Router);
  private userService = inject(UserService);
  isActive = true;
  showEditProfil = false;
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
  @ViewChild('profilWrapper') profilWrapper?: ElementRef;


  ngOnInit(): void {
    this.isActive = this.userStatus;
    this.originalUserImage = this.userImage;
  }

  closeProfil() {
    this.showAvatarChoice = false;
    this.closed.emit();
  }


  async saveAvatarChange(): Promise<void> {
    try {
      await this.userService.updateUserImage(this.activeUserId, this.userImage);
      this.originalUserImage = this.userImage;
    } catch (err) {
      console.error('Avatar-Update fehlgeschlagen:', err);
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
        this.showEditProfil = false;
      })
      .catch(err => console.error('Name-Update fehlgeschlagen:', err));
  }


  onMainClick(event: MouseEvent) {
    const insideSection = this.profilWrapper?.nativeElement?.contains(
      event.target
    );
    if (!insideSection) {
      this.closed.emit();
    }
  }


  onEditClick() {
    this.showEditProfil = true;
  }


  async deleteMember() {
    if (!this.activeUserId) return;
    try {
      await this.userService.deleteUser(this.activeUserId);
      this.router.navigate(['/auth/login']);
    } catch (err) {
      console.error('Account-Loeschung fehlgeschlagen:', err);
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
