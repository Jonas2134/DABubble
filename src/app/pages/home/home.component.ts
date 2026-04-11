import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';
import { ContactBarComponent } from '../../components/contact-bar/contact-bar.component';
import { MessageAreaComponent } from '../../components/message-area/message-area.component';
import { SearchBarComponent } from '../../components/header/search-bar/search-bar.component';
import { DeviceVisibleComponent } from '../../components/device-visible/device-visible.component';
import { AuthentificationService } from '../../shared/services/authentification.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    ContactBarComponent,
    MessageAreaComponent,
    SearchBarComponent,
    DeviceVisibleComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthentificationService);
  private resizeListener = () => this.updateScreenSize();

  smallSize = false;
  messageIn = false;
  sectionVisible = true;

  activeUserId: string | null = null;

  chatType: 'private' | 'channel' | 'thread' | 'new' = 'private';
  chatId: string | null = null;

  threadId: string | null = null;
  isThreadOpen = false;

  ngOnInit(): void {
    this.activeUserId = this.route.snapshot.paramMap.get('activeUserId');
    this.chatId = this.activeUserId;
    this.chatType = 'private';



    this.updateScreenSize();
    window.addEventListener('resize', this.resizeListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
  }

  toggleSection() {
    this.sectionVisible = !this.sectionVisible;
  }

  handleMessageInToggle(state: boolean) {
    this.messageIn = state;
  }

  handleOpenChat(event: {
    chatType: 'private' | 'channel' | 'new';
    chatId: string | null;
  }) {
    this.chatType = event.chatType;
    this.chatId = event.chatId;
    this.isThreadOpen = false;
    this.threadId = '';
  }

  handleOpenThread(event: {
    chatType: 'channel' | 'private';
    chatId: string;
    threadId: string;
  }) {
    this.chatType = event.chatType;
    this.chatId = event.chatId;
    this.isThreadOpen = true;
    this.threadId = event.threadId;
  }

  openThread(threadId: string) {
    this.isThreadOpen = true;
    this.threadId = threadId;
  }

  closeThread() {
    this.isThreadOpen = false;
    this.threadId = null;
  }

  private updateScreenSize() {
    this.smallSize = window.innerWidth < 1000;
  }
}
