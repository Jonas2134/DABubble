import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { Firestore, doc, updateDoc, deleteDoc } from '@angular/fire/firestore';
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

export class ProfilComponent {
  private originalUserImage!: string;
  
  private firestore = inject(Firestore);
  private router = inject(Router);
  private userService = inject(UserService);
  isActive: boolean = true;
  showEditProfil: boolean = false;
  showAvatarChoice = false;
  editedUserName = new FormControl('');
  items = [1, 2, 3, 4, 5, 6];

  @Input() showButton: boolean = false;
  @Input() userName: string = '';
  @Input() userEmail: string = '';
  @Input() userImage: string = '';
  @Input() userStatus: boolean = false;
  @Input() userId: string = '';
  @Input() activeUserId: string = '';
  @Input() size: 'small' | 'big' = 'small';
  @Output() close = new EventEmitter<void>();
  @Output() openChat = new EventEmitter<{chatType: 'private'; chatId: string}>();
  @ViewChild('profilWrapper') profilWrapper?: ElementRef;


  ngOnInit(): void {
    this.isActive = this.userStatus;
    this.originalUserImage = this.userImage;
  }

  closeProfil() {
    this.showAvatarChoice = false;
    this.close.emit();
  }


  async saveAvatarChange(): Promise<void> {
    try {
      await this.userService.updateUserImage(this.activeUserId, this.userImage);
      this.originalUserImage = this.userImage;
    } finally {
      this.showAvatarChoice = false;
    }    
  }


  changeUserName() {
    const name = this.editedUserName.value?.trim();
    if (!this.activeUserId || !name) return;
    const userRef = doc(this.firestore, 'users', this.activeUserId);
    updateDoc(userRef, {
      uName: name,
    }).then(() => {
      this.userName = name;
      this.showEditProfil = false;
    });
  }


  onMainClick(event: MouseEvent) {
    const insideSection = this.profilWrapper?.nativeElement?.contains(
      event.target
    );
    if (!insideSection) {
      this.close.emit();
    }
  }


  onEditClick() {
    this.showEditProfil = true;
  }


  async deleteMember() {
    if (!this.activeUserId) return;
    const userRef = doc(this.firestore, 'users', this.activeUserId);
    await deleteDoc(userRef);
    this.router.navigate(['/access']);
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
    this.close.emit();
  }
}
