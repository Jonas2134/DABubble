import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  Input,
  inject,
  EventEmitter,
  Output,
} from '@angular/core';
import { ButtonComponent } from '../../button/button.component';
import { ProfilComponent } from '../../profil/profil.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceVisibleComponent } from '../../device-visible/device-visible.component';
import { AuthentificationService } from '../../../shared/services/authentification.service';
import { UserService } from '../../../shared/services/user.service';
import { ChannelService } from '../../../shared/services/channel.service';
import { MessageService } from '../../../shared/services/message.service';
import { slideUpDown } from '../../../shared/animations/animations';

@Component({
  selector: 'app-user-name',
  standalone: true,
  imports: [CommonModule, ButtonComponent, ProfilComponent, DeviceVisibleComponent],
  templateUrl: './user-name.component.html',
  styleUrl: './user-name.component.scss',
  animations: [slideUpDown],
})
export class UserNameComponent {
  private authService = inject(AuthentificationService);
  private channelService = inject(ChannelService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private router = inject(Router);
  @Input() activeUserId!: string | null;
  isLogOutVisible: boolean = false;
  showProfil: boolean = false;
  userStatus: boolean | string = false;
  userName: string = '';
  userEmail: string = '';
  userImage: string = '';
  userId: string | undefined = '';
  windowSize = window.innerWidth;
  @ViewChild('tabletToggleBtn') tabletToggleBtn?: ElementRef;
  @ViewChild('arrowToggleBtn') arrowToggleBtn?: ElementRef;
  @ViewChild('logOutBox') logOutBox?: ElementRef;
  @ViewChild('profilWrapper') profilWrapper?: ElementRef;

  @Output() openChat = new EventEmitter<{
    chatType: 'private';
    chatId: string;
  }>();


  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('activeUserId');
    if (!userId) return;
    this.userService.getUserById(userId).subscribe((user) => {
      if (user) {
        this.userName = user.name;
        this.userEmail = user.email;
        this.userImage = user.userImage;
        this.userStatus = user.status;
        this.userId = user.id;
      }
    });
  }

  toggleLogOut() {
    this.isLogOutVisible = !this.isLogOutVisible;
  }

  toggleImage() {
    this.toggleLogOut();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInsideLogOut = this.logOutBox?.nativeElement?.contains(
      event.target
    );
    const clickedToggleTablet = this.tabletToggleBtn?.nativeElement?.contains(
      event.target
    );
    const clickedArrow = this.arrowToggleBtn?.nativeElement?.contains(
      event.target
    );
    const clickedInsideProfil = this.profilWrapper?.nativeElement?.contains(
      event.target
    );
    const clickedOutside =
      !clickedInsideLogOut &&
      !clickedToggleTablet &&
      !clickedArrow &&
      !clickedInsideProfil;
    if (this.isLogOutVisible && clickedOutside) {
      this.isLogOutVisible = false;
    }
  }


  openProfil() { 
    this.showProfil = true;
  }

  async logOut() {
    if (this.userName === 'Gast') {      
      await this.channelService.deleteChannelsByCreator(this.activeUserId!);
      await this.messageService.deleteMessagesBySender(this.activeUserId!);
    } 
    await this.authService.logout();
    await this.router.navigate(['/access']);
  }
}
