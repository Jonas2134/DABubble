import { CommonModule } from '@angular/common';
import { AnimationEvent } from '@angular/animations';
import { Component, ElementRef, EventEmitter, HostListener, Output, Input, ViewChild } from '@angular/core';
import { AddNewMembersComponent } from '../../../../general-components/add-new-members/add-new-members.component';
import { debounceTime, distinctUntilChanged, Subject, switchMap, tap } from 'rxjs';
import { ChannelService } from '../../../../../shared/services/channel.service';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';

const sectionEnter = trigger('sectionEnter', [
  transition(':enter', [
    style({ transform: 'translate(-100%, -50%)', opacity: 0 }),
    animate('0.8s ease-out', style({ transform: 'translate(-50%, -50%)', opacity: 1 }))
  ])
]);

const popupAnim = trigger('popupAnim', [
  transition('desktop => void', [
    animate('0.8s ease', style({ transform: 'translate(-150%, -50%)', opacity: 0 }))
  ]),
  transition('void => mobile', [
    style({ transform: 'translateY(100%)', opacity: 0 }),
    animate('0.8s ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
  ]),
  transition('mobile => void', [
    animate('0.8s ease-out', style({ transform: 'translateY(100%)', opacity: 0 }))
  ])
]);

@Component({
  selector: 'app-add-channel',
  standalone: true,
  imports: [CommonModule, AddNewMembersComponent, FormsModule],
  templateUrl: './add-channel.component.html',
  styleUrl: './add-channel.component.scss',
  animations: [sectionEnter, popupAnim],
})

export class AddChannelComponent{
  @Output() close = new EventEmitter<void>();
  @Input() activeUserId!: string | null;
  showAddMember: boolean = true;
  channelId: any = '';
  channelName: string = '';
  channelDescription: string = '';
  isMobile = window.innerWidth <= 600;
  nameExists = false;
  isVisible: boolean = true;
  private nameCheck$ = new Subject<string>();
  @ViewChild('addChannel') channelWrapper?: ElementRef;
  @ViewChild('addChannelAll') memberAddWrapper?: ElementRef;

  constructor( private elRef: ElementRef, private channelService: ChannelService) {}

  get animMode() { return this.isMobile ? 'mobile' : 'desktop'; }

  ngOnInit(): void {
    this.nameCheck$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(name => this.channelService.checkChannelNameExists(name)),
        tap(exists => (this.nameExists = exists))
      )
      .subscribe();
  }

  
  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    const clickedInside = this.elRef.nativeElement
      .querySelector('section')
      ?.contains(event.target);
    if (!clickedInside) {
      this.triggerSlideOut();
    }
  }

  
  triggerSlideOut() {
    if (this.showAddMember) {
      this.close.emit();
    } else {
      this.isVisible = false;
    }
  }

  onAnimDone(event: AnimationEvent) {
    if (event.toState === 'void') {
      this.close.emit();
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 600;
  }

  closeWindow() {
    this.close.emit();
  }


  checkNameUnique(name: string) {
    if (!name.trim()) {
      this.nameExists = false;
      return;
    }
    this.nameCheck$.next(name.trim());
  }


  addNewChannel(name: string, description: string){
    if (!name || !this.activeUserId) return;
    this.channelName = name;
    this.channelDescription = description;
    this.showAddMember = false;    
  }
} 
