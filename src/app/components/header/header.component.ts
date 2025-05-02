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
import { filter, first } from 'rxjs';

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
  private router = inject(Router);

  user: Signal<UserProfile | null> = toSignal(this.auth.currentUser$, {
    initialValue: null,
  });

  logout() {
    this.auth.logout();
  }

  deleteAccount() {
    this.auth.deleteAccount();
  }

  currentUrl = signal(this.router.url);

  private readonly PUBLIC = ['/login', '/register', '/onboarding'];
  isPublicPage = computed(() => {
    const url = this.currentUrl();
    return this.PUBLIC.some((p) => url.startsWith(p));
  });

  pageBg = computed(() => {
    const u = this.user();
    const pub = this.isPublicPage();
    if (!u && pub) return 'bg-gray-300';
    if (!u && !pub) return 'bg-gray-50';
    return '';
  });

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.currentUrl.set(e.urlAfterRedirects);
      });
  }
}
