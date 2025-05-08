import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { ChatService, ChatPreview } from '../../../services/chat.service';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { filter, switchMap, map, shareReplay } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat-page',
  imports: [CommonModule, ChatListComponent, RouterOutlet],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css',
})
export class ChatPageComponent {
  private auth = inject(AuthService);
  private chatSvc = inject(ChatService);

  uid$: Observable<string> = this.auth.currentUser$.pipe(
    filter((u): u is UserProfile => !!u),
    map((u) => u.uid),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  chats$: Observable<ChatPreview[]> = this.uid$.pipe(
    switchMap((uid) => this.chatSvc.listenChatsForUser(uid)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
}
