import { Component, inject, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './components/header/header.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { first } from 'rxjs';
import { AuthService, UserProfile } from './services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private auth = inject(AuthService);

  user: Signal<UserProfile | null> = toSignal(this.auth.currentUser$, {
    initialValue: null,
  });

  initialized = false;

  constructor() {
    this.auth.currentUser$.pipe(first()).subscribe(() => {
      this.initialized = true;
    });
  }
}
