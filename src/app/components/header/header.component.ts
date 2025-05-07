import {
  Component,
  computed,
  EventEmitter,
  inject,
  Output,
  signal,
  Signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';

import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService, UserProfile } from '../../services/auth.service';
import { filter, switchMap } from 'rxjs';
import { ChatPreview, ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Output() toggleChats = new EventEmitter<void>();

  private auth = inject(AuthService);
  private chatSvc = inject(ChatService);
  private router = inject(Router);

  user: Signal<UserProfile | null> = toSignal(this.auth.currentUser$, {
    initialValue: null,
  });

  currentUrl = signal(this.router.url);
  private readonly PUBLIC = ['/login', '/register', '/boarding'];
  isPublicPage = computed(() =>
    this.PUBLIC.some((p) => this.currentUrl().startsWith(p))
  );
  pageBg = computed(() => {
    const u = this.user();
    const pub = this.isPublicPage();
    if (!u && pub) return 'bg-gray-300';
    if (!u && !pub) return 'bg-gray-50';
    return '';
  });

  private chats$ = this.auth.currentUser$.pipe(
    filter((u): u is UserProfile => !!u),
    switchMap((u) => this.chatSvc.listenChatsForUser(u.uid))
  );
  chats: Signal<ChatPreview[]> = toSignal(this.chats$, { initialValue: [] });

  unreadCount = computed(
    () =>
      this.chats().filter((c) => {
        if (!c.lastMessageAt) return false;
        if (c.lastReadAt == null) return true;
        return c.lastMessageAt.toMillis() > c.lastReadAt.toMillis();
      }).length
  );

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentUrl.set(e.urlAfterRedirects);
      });
  }

  logout() {
    this.auth.logout();
  }

  deleteAccount() {
    this.auth.deleteAccount();
  }

  onToggleChats() {
    this.toggleChats.emit();
  }
}
