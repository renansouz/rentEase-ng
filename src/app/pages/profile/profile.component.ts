import { Component, inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { AuthService, UserProfile } from '../../services/auth.service';

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
    const birthDate = this.user()?.birthDate;
    return birthDate ? new Date(birthDate).toDateString() : 'N/A';
  }
}
