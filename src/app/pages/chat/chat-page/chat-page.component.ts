import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ActivatedRoute,
  Router,
  RouterOutlet,
  NavigationEnd,
} from '@angular/router';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { ChatService, ChatPreview } from '../../../services/chat.service';
import { ChatListComponent } from '../chat-list/chat-list.component';
import { filter, switchMap, map, shareReplay, startWith } from 'rxjs/operators';
import { Observable, merge } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-chat-page',
  imports: [CommonModule, ChatListComponent, RouterOutlet],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.css',
})
export class ChatPageComponent {
  private auth = inject(AuthService);
  private chatSvc = inject(ChatService);
  private router = inject(Router);

  uid$: Observable<string> = this.auth.currentUser$.pipe(
    filter((u): u is UserProfile => !!u),
    map((u) => u.uid),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  chats$: Observable<ChatPreview[]> = this.uid$.pipe(
    switchMap((uid) => this.chatSvc.listenChatsForUser(uid)),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  isChatOpen = toSignal(
    merge(
      this.router.events.pipe(
        startWith(null),
        filter(
          (e): e is NavigationEnd | null =>
            e === null || e instanceof NavigationEnd
        ),
        map((e) => (e === null ? this.router.url : e.urlAfterRedirects))
      )
    ).pipe(
      map((url) => {
        return /^\/chat\/[^\/].*$/.test(url);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    ),
    { initialValue: false }
  );
}
