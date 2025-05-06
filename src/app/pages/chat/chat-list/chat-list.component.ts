import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { ChatPreview } from '../../../services/chat.service';
import { Flat, FlatService } from '../../../services/flat.service';
import { map } from 'rxjs';

interface EnrichedPreview extends ChatPreview {
  photoUrl: string;
  title: string;
}

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.css',
})
export class ChatListComponent {
  @Input() chats: ChatPreview[] = [];
  @Output() chatClicked = new EventEmitter<string>();

  private flatSvc = inject(FlatService);
  flats = toSignal(
    this.flatSvc
      .getAllFlats()
      .pipe(map((arr) => Object.fromEntries(arr.map((f) => [f.id, f])))),
    { initialValue: {} as Record<string, Flat & { id: string }> }
  );

  trackByChatId(_idx: number, item: ChatPreview) {
    return item.chatId;
  }
}
