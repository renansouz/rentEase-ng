import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Firestore, doc, docData, Timestamp } from '@angular/fire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  isAdmin?: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-public-profile',
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule, MatIcon],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.css',
})
export class PublicProfileComponent {
  private route = inject(ActivatedRoute);
  private db = inject(Firestore);
  private location = inject(Location);

  private uid = this.route.snapshot.paramMap.get('id')!;

  user = toSignal(
    docData(doc(this.db, 'users', this.uid), {
      idField: 'uid',
    }) as Observable<UserProfile>,
    { initialValue: null }
  );

  get formattedCreatedAt(): string {
    const raw = this.user()?.createdAt;
    if (!raw) return '';
    const d =
      raw instanceof Timestamp
        ? raw.toDate()
        : raw instanceof Date
        ? raw
        : new Date(raw);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }

  goBack() {
    this.location.back();
  }
}
