import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AuthService, UserProfile } from '../../services/auth.service';

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

  user: Signal<UserProfile | null> = toSignal(this.auth.currentUser$, {
    initialValue: null,
  });

  logout() {
    this.auth.logout();
  }

  deleteAccount() {
    this.auth.deleteAccount();
  }
}
