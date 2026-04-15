import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { SearchInformationComponent } from '../../search/search-information.component';
import { DeviceVisibleComponent } from '../../../ui/device-visible/device-visible.component';
@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    SearchInformationComponent,
    DeviceVisibleComponent,
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent {
  searchValue = '';
  searchText = '';
  charCount = 0;
  showInformation = false;
  @ViewChild('searchWrapper', { static: false }) searchWrapper?: ElementRef;

  @Output() openChat = new EventEmitter<{
    chatType: 'private' | 'channel' | 'new';
    chatId: string;
  }>();

  @Output() openThread = new EventEmitter<{
    chatType: 'channel' | 'private';
    chatId: string;
    threadId: string;
  }>();

  @HostListener('document:click', ['$event'])
  onGlobalClick(event: MouseEvent) {
    const clickedInside = this.searchWrapper?.nativeElement.contains(
      event.target
    );
    if (!clickedInside) {
      this.closeSearchInfo();
    }
  }

  onKey(event: KeyboardEvent) {
    const input = (event.target as HTMLInputElement).value;
    this.searchValue = input;
    this.charCount = input.length;
    if (this.charCount >= 3) {
      this.showInformation = true;
    } else {
      this.showInformation = false;
    }
  }

  closeSearchInfo() {
    this.searchValue = '';
    this.showInformation = false;
  }

  
}
