import { Component, computed, inject, signal, Signal } from '@angular/core';
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
import { filter, switchMap, shareReplay } from 'rxjs/operators';
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
  private auth = inject(AuthService);
  private chatSvc = inject(ChatService);
  private router = inject(Router);

  user: Signal<UserProfile | null> = toSignal(this.auth.currentUser$, {
    initialValue: null,
  });

  currentUrl = signal(this.router.url);
  private readonly BOARDING = ['/boarding'];

  isBoardingPage = computed(() => this.currentUrl() === this.BOARDING[0]);

  headerClasses = computed(() => {
    const loggedIn = !!this.user();
    if (loggedIn) {
      return [
        'bg-gray-900',
        'sm:fixed sm:z-10 sm:w-full',
        'text-white shadow p-2',
        'flex  max-sm:space-y-2 items-center justify-between',
      ].join(' ');
    }

    if (this.isBoardingPage()) {
      return [
        'bg-gray-50 max-h-[76px]',
        'static',
        'shadow-none p-4',
        'flex items-center justify-between',
      ].join(' ');
    } else {
      return [
        'bg-gray-300 -z-50 max-h-[76px]',
        'static',
        'shadow-none p-4',
        'flex items-center justify-between',
      ].join(' ');
    }
  });

  private chats$ = this.auth.currentUser$.pipe(
    filter((u): u is UserProfile => !!u),
    switchMap((u) => this.chatSvc.listenChatsForUser(u.uid)),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  chats: Signal<ChatPreview[]> = toSignal(this.chats$, { initialValue: [] });

  unreadCount = computed(() =>
    this.chats().reduce((sum, c) => sum + (c.unreadMessagesCount || 0), 0)
  );

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) =>
        this.currentUrl.set(e.urlAfterRedirects)
      );
  }

  logout() {
    this.auth.logout();
  }

  deleteAccount() {
    this.auth.deleteAccount();
  }
}
