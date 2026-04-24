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
  computed,
} from '@angular/core';
import { ButtonComponent } from '../../../ui/button/button.component';
import { ProfilComponent } from '../../../ui/profil/profil.component';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceVisibleComponent } from '../../../ui/device-visible/device-visible.component';
import { AuthentificationService } from '../../../shared/services/authentification.service';
import { UserService } from '../../../shared/services/user.service';
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
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);
  private router = inject(Router);

  @Input() activeUserId!: string | null;

  isLogOutVisible = false;
  showProfil = false;

  @ViewChild('tabletToggleBtn') tabletToggleBtn?: ElementRef;
  @ViewChild('desktopToggleBtn') desktopToggleBtn?: ElementRef;
  @ViewChild('arrowToggleBtn', { read: ElementRef }) arrowToggleBtn?: ElementRef;
  @ViewChild('logOutBox') logOutBox?: ElementRef;
  @ViewChild('profilWrapper') profilWrapper?: ElementRef;

  @Output() openChat = new EventEmitter<{
    chatType: 'private';
    chatId: string;
  }>();

  private readonly routeUserId = this.route.snapshot.paramMap.get('activeUserId');

  readonly user = computed(() =>
    this.routeUserId ? this.userService.getUserById(this.routeUserId) : undefined
  );

  get userName() { return this.user()?.name ?? ''; }
  get userEmail() { return this.user()?.email ?? ''; }
  get userImage() { return this.user()?.userImage ?? ''; }
  readonly userStatus = computed(() => this.user()?.status ?? false);
  get userId() { return this.user()?.id ?? ''; }

  toggleLogOut() {
    this.isLogOutVisible = !this.isLogOutVisible;
  }

  toggleImage() {
    this.toggleLogOut();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const clickedInsideLogOut = this.logOutBox?.nativeElement?.contains(event.target);
    const clickedToggleTablet = this.tabletToggleBtn?.nativeElement?.contains(event.target);
    const clickedToggleDesktop = this.desktopToggleBtn?.nativeElement?.contains(event.target);
    const clickedArrow = this.arrowToggleBtn?.nativeElement?.contains(event.target);
    const clickedInsideProfil = this.profilWrapper?.nativeElement?.contains(event.target);
    const clickedOutside =
      !clickedInsideLogOut &&
      !clickedToggleTablet &&
      !clickedToggleDesktop &&
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
    await this.authService.logout();
    await this.router.navigate(['/auth/login']);
  }
}
