import { Component } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';

import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  user = { firstName: 'Renan', lastName: 'Silva', isAdmin: true };

  logout() {
    // TODO:  hook up my AuthService.logout()
  }

  deleteAccount() {
    // TODO:  hook up my AuthService.deleteAccount()
  }
}
