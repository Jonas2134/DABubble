import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, SimpleChanges, ViewChild, ViewChildren, ElementRef, QueryList, OnChanges, OnInit, ViewEncapsulation, inject, DestroyRef, AfterViewInit, OnDestroy } from '@angular/core';
import { User } from '../../shared/interfaces/user.interface';
import { ChannelService } from '../../shared/services/channel.service';
import { UserService } from '../../shared/services/user.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-add-new-members',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './add-new-members.component.html',
  styleUrls: ['./add-new-members.component.scss'],
  encapsulation: ViewEncapsulation.None,
  host: {
    '(click)': '$event.stopPropagation()'
  }
})
export class AddNewMembersComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private channelService = inject(ChannelService);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  private resizeObserver?: ResizeObserver;

  memberAddElement = false;
  memberInputId = '';
  memberInputAdd = '';
  memberInputImage = '';
  showMember = false;
  showOverlay = false;
  searchValue = '';
  charCount = 0;
  filteredMembers: User[] = [];
  availableMembers: User[] = [];
  selectedMemberIds: string[] = [];
  selectedMembers: User[] = [];
  displayCount = 1;
  selectedOption = new FormControl('');

  @Input() channelMembers: User[] = [];
  @Input() activeUserId!: string | null;
  @Input() channelId = '';
  @Input() channelName = '';
  @Input() showInput = true;
  @Input() channelDescription = '';
  @Input() showXLine = false;
  @Output() closed = new EventEmitter<void>();
  @ViewChild('memberInput', { static: false }) memberInput?: ElementRef<HTMLElement>;
  @ViewChildren('containerDelete', { read: ElementRef }) pills!: QueryList<ElementRef<HTMLDivElement>>;

  ngOnInit() {
    this.rebuildAvailableList();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['channelMembers']) {
      this.rebuildAvailableList();
    }
  }

  private rebuildAvailableList() {
    const allUsers = this.userService.users();
    const excluded = new Set<string>();
    for (const u of this.channelMembers) {
      excluded.add(u.id);
    }
    if (this.activeUserId) {
      excluded.add(this.activeUserId);
    }
    this.availableMembers = allUsers.filter(u => !excluded.has(u.id));
    this.filteredMembers = [...this.availableMembers];
  }

  ngAfterViewInit() {
    if (this.memberInput) {
      this.resizeObserver = new ResizeObserver(() => this.updateDisplayCount());
      this.resizeObserver.observe(this.memberInput.nativeElement);
      this.updateDisplayCount();
      const sub = this.pills.changes.subscribe(() => this.updateDisplayCount());
      this.destroyRef.onDestroy(() => sub.unsubscribe());
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  onFocusOut(): void {
    this.showMember = false;
    this.showOverlay = false;
  }

  onInputFocus(): void {
    this.filteredMembers = [...this.availableMembers];
    this.showMember = true;
    this.showOverlay = true;
  }

  private updateDisplayCount() {
    if (!this.memberInput) return;
    const containerW = this.memberInput.nativeElement.clientWidth;
    const pillsArr = this.pills.toArray();
    if (!pillsArr.length) {
      this.displayCount = 1;
      return;
    }
    const pillEl = pillsArr[0].nativeElement;
    const style = getComputedStyle(pillEl);
    const totalPillW =
      pillEl.offsetWidth +
      parseFloat(style.marginLeft) +
      parseFloat(style.marginRight);
    const rawCount = Math.floor(containerW / totalPillW);
    this.displayCount = Math.max(1, Math.min(rawCount, 2));
  }

  onKey(event: KeyboardEvent): void {
    const input = (event.target as HTMLInputElement)
      .value.trim().toLowerCase();
    this.searchValue = input;
    if (!input) {
      this.filteredMembers = [...this.availableMembers];
    } else {
      this.filteredMembers = this.availableMembers.filter(u =>
        u.name.toLowerCase().startsWith(input)
      );
    }
  }

  toggleMember(member: User) {
    const id = member.id;
    const idx = this.selectedMemberIds.indexOf(id);
    if (idx > -1) {
      this.selectedMemberIds.splice(idx, 1);
      this.selectedMembers = this.selectedMembers.filter(m => m.id !== id);
    } else {
      this.selectedMemberIds.push(id);
      this.selectedMembers.push(member);
    }
    this.memberAddElement = this.selectedMembers.length > 0;
    this.showMember = false;
    this.showOverlay = false;
    this.searchValue = '';
  }

  isSelected(member: User): boolean {
    return this.selectedMembers.some(m => m.id === member.id);
  }

  trackById(_: number, u: User) { return u.id; }

  emitClose() {
    this.closed.emit();
  }

  inputNameClose(): void {
    this.memberAddElement = false;
    this.memberInputAdd = '';
    this.memberInputImage = '';
    this.memberInputId = '';
  }

  async addNewChannelMembers() {
    if (!this.channelId || this.selectedMemberIds.length === 0) return;
    try {
      await this.channelService.addUsersToChannel(
        this.channelId,
        ...this.selectedMemberIds
      );
      this.selectedMemberIds = [];
      this.selectedMembers = [];
      this.closed.emit();
    } catch (err) {
      console.error('Mitglieder hinzufuegen fehlgeschlagen:', err);
    }
  }

  async createNewChannel(name: string, description: string) {
    if (!name || !this.activeUserId) return;
    let ids: string[];
    if (this.selectedOption.value === 'option1') {
      ids = this.userService.users().map((u) => u.id);
    } else {
      ids = [...this.selectedMemberIds];
    }

    if (!ids.includes(this.activeUserId)) {
      ids.unshift(this.activeUserId);
    }
    await this.channelService.createChannelWithUsers(
      name,
      description,
      this.activeUserId,
      ids
    );
    this.emitClose();
  }
}
