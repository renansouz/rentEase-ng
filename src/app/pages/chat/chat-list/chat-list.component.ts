import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ChatPreview } from '../../../services/chat.service';
import { FlatService, Flat } from '../../../services/flat.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-chat-list',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './chat-list.component.html',
  styleUrl: './chat-list.component.css',
})
export class ChatListComponent {
  readonly chats = input<ChatPreview[]>([]);
  readonly currentUid = input<string | null>(null);

  private flatSvc = inject(FlatService);
  flats = toSignal(
    this.flatSvc
      .getAllFlats()
      .pipe(map((arr) => Object.fromEntries(arr.map((f) => [f.id, f])))),
    { initialValue: {} as Record<string, Flat & { id: string }> }
  );

  trackByChatId(_idx: number, c: ChatPreview) {
    return c.chatId;
  }
}
