import { Component, inject, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ChatService, ChatPreview } from '../../services/chat.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';

import { ChatListComponent } from '../../pages/chat/chat-list/chat-list.component';
import { ChatWindowComponent } from '../../pages/chat/chat-window/chat-window.component';

@Component({
  selector: 'app-chat-sidebar',
  imports: [CommonModule, ChatListComponent, ChatWindowComponent],
  templateUrl: './chat-sidebar.component.html',
  styleUrl: './chat-sidebar.component.css',
})
export class ChatSidebarComponent {
  private auth = inject(AuthService);
  private chatSvc = inject(ChatService);

  chats: Signal<ChatPreview[]> = toSignal(
    this.auth.currentUser$.pipe(
      filter((u): u is UserProfile => u !== null),
      switchMap((u) => this.chatSvc.listenChatsForUser(u.uid))
    ),
    { initialValue: [] }
  );

  selectedChatId = signal<string | null>(null);

  onSelectChat(chatId: string) {
    this.selectedChatId.set(chatId);
  }

  close() {
    this.selectedChatId.set(null);
  }
}
