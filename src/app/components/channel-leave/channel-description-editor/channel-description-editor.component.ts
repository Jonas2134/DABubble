import { Component, EventEmitter, Input, OnInit, OnDestroy, Output, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Channel } from '../../../shared/interfaces/channel.interface';
import { ChannelService } from '../../../shared/services/channel.service';
import { UserService } from '../../../shared/services/user.service';
import { fadeSlide } from '../../../shared/animations/animations';

@Component({
  selector: 'app-channel-description-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './channel-description-editor.component.html',
  styleUrl: './channel-description-editor.component.scss',
  animations: [fadeSlide],
})
export class ChannelDescriptionEditorComponent implements OnInit, OnDestroy {
  private channelService = inject(ChannelService);
  private userService = inject(UserService);
  private destroy$ = new Subject<void>();

  @Input() channelData: Channel | null = null;
  @Output() descriptionUpdated = new EventEmitter<string>();

  editDescription = true;
  editedDescription = new FormControl('');
  hasInteracted = false;
  createdByUserName = 'Unbekannt';

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

  toggleDescription() {
    this.hasInteracted = true;
    this.editDescription = !this.editDescription;
    if (this.editDescription && this.channelData?.cDescription) {
      this.editedDescription.setValue(this.channelData.cDescription);
    }
  }

  saveDescription() {
    const newDesc = this.editedDescription.value?.trim() ?? '';
    if (!newDesc || !this.channelData?.cId) return;
    this.channelService.updateChannelDescription(this.channelData.cId, newDesc)
      .then(() => {
        this.channelData!.cDescription = newDesc;
        this.descriptionUpdated.emit(newDesc);
      })
      .catch(() => {});
  }
}
