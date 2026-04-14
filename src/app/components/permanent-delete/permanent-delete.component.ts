import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { MessageService } from '../../shared/services/message.service';
import { ChannelService } from '../../shared/services/channel.service';

type DeleteTarget = 'message' | 'channel' | 'user';

@Component({
  selector: 'app-permanent-delete',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './permanent-delete.component.html',
  styleUrl: './permanent-delete.component.scss',
})
export class PermanentDeleteComponent {
  private messageService = inject(MessageService);
  private channelService = inject(ChannelService);

  @Input({ required: true }) target!: DeleteTarget;
  @Input({ required: true }) id!: string;

  @Output() closed = new EventEmitter<void>();

  onNo(): void {
    this.closed.emit();
  }

  onYes(): void {
    switch (this.target) {
      case 'message':
        this.messageService
          .deleteMessage(this.id)
          .then(() => this.closed.emit())
          .catch((err) =>
            console.error('Fehler beim Löschen der Nachricht', err)
          );
        break;

      case 'channel':
        this.channelService
          .deleteChannel(this.id)
          .then(() => this.closed.emit())
          .catch((err) =>
            console.error('Fehler beim Löschen des Channels', err)
          );
        this.closed.emit();
        break;
      default:
        console.warn('Unbekannter Lösch‑Typ:', this.target);
        this.closed.emit();
    }
  }
  get heading(): string {
    switch (this.target) {
      case 'message':
        return 'Nachricht permanent löschen?';
      case 'channel':
        return 'Channel permanent löschen?';
      case 'user':
        return 'Account permanent löschen?';
      default:
        return 'Permanent löschen?';
    }
  }
}
