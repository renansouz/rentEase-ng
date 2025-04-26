import { Component, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { AuthService, UserProfile } from '../../services/auth.service';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MatCardModule, MatButtonModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user: Signal<UserProfile | null> = toSignal(this.auth.currentUser$, {
    initialValue: null,
  });

  edit() {
    this.router.navigate(['/profile/edit']);
  }

  get formattedBirthDate(): string {
    const raw = this.user()?.birthDate;
    if (!raw) return 'N/A';

    let date: Date;

    if (raw instanceof Timestamp) {
      date = raw.toDate();
    } else {
      date = raw instanceof Date ? raw : new Date(raw);
    }
    if (isNaN(date.getTime())) return 'Invalid date';

    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
