import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Channel } from '../../../shared/interfaces/channel.interface';
import { ChannelService } from '../../../shared/services/channel.service';
import { fadeSlide } from '../../../shared/animations/animations';

@Component({
  selector: 'app-channel-name-editor',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './channel-name-editor.component.html',
  styleUrl: './channel-name-editor.component.scss',
  animations: [fadeSlide],
})
export class ChannelNameEditorComponent {
  private channelService = inject(ChannelService);

  @Input() channelData: Channel | null = null;
  @Output() nameUpdated = new EventEmitter<string>();

  editMode = true;
  editedChannelName = new FormControl('');
  hasInteractedName = false;
  nameExists = false;

  toggleEdit() {
    this.hasInteractedName = true;
    this.editMode = !this.editMode;
    if (!this.editMode && this.channelData?.name) {
      this.editedChannelName.setValue(this.channelData.name);
    }
  }

  async onNameInput() {
    const trimmed = this.editedChannelName.value?.trim() ?? '';
    if (trimmed.length < 3 || trimmed === this.channelData?.name) {
      this.nameExists = false;
      return;
    }
    try {
      this.nameExists = await this.channelService.checkChannelNameExists(trimmed);
    } catch {
      this.nameExists = false;
    }
  }

  saveNewName() {
    const newName = this.editedChannelName.value?.trim() ?? '';
    if (!newName || newName.length < 3 || this.nameExists || !this.channelData?.id) return;
    this.channelService
      .updateChannelName(this.channelData.id, newName)
      .then(() => {
        this.nameUpdated.emit(newName);
        this.toggleEdit();
      })
      .catch(err => console.error('Channel-Name Update fehlgeschlagen:', err));
  }
}
