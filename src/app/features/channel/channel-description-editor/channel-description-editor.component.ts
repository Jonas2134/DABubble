import { Component, EventEmitter, Input, Output, inject, computed } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
export class ChannelDescriptionEditorComponent {
  private channelService = inject(ChannelService);
  private userService = inject(UserService);

  @Input() channelData: Channel | null = null;
  @Output() descriptionUpdated = new EventEmitter<string>();

  editDescription = true;
  editedDescription = new FormControl('');
  hasInteracted = false;

  readonly createdByUserName = computed(() => {
    const user = this.userService.users().find(u => u.id === this.channelData?.createdByUser);
    return user?.name ?? 'Unbekannt';
  });

  toggleDescription() {
    this.hasInteracted = true;
    this.editDescription = !this.editDescription;
    if (this.editDescription && this.channelData?.description) {
      this.editedDescription.setValue(this.channelData.description);
    }
  }

  saveDescription() {
    const newDesc = this.editedDescription.value?.trim() ?? '';
    if (!newDesc || !this.channelData?.id) return;
    this.channelService.updateChannelDescription(this.channelData.id, newDesc)
      .then(() => {
        this.channelData!.description = newDesc;
        this.descriptionUpdated.emit(newDesc);
      })
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .catch(() => {});
  }
}
