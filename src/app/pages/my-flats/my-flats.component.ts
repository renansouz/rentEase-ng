import { Component, Signal, computed, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { filter, switchMap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

import { FlatService, Flat } from '../../services/flat.service';
import { AuthService, UserProfile } from '../../services/auth.service';

@Component({
  selector: 'app-my-flats',
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './my-flats.component.html',
  styleUrl: './my-flats.component.css',
})
export class MyFlatsComponent {
  private auth = inject(AuthService);
  private flatService = inject(FlatService);
  private router = inject(Router);

  private flats$ = this.auth.currentUser$.pipe(
    filter((u): u is UserProfile => u !== null),
    switchMap((u) => this.flatService.getFlatsByOwner(u.uid))
  );

  flatsSignal: Signal<(Flat & { id: string })[] | null> = toSignal(
    this.flats$,
    {
      initialValue: null,
    }
  );

  loading = computed(() => this.flatsSignal() === null);

  viewEdit(id: string) {
    this.router.navigate(['/flats', id, 'edit']);
  }

  onEditClick(event: MouseEvent, flatId: string) {
    event.stopPropagation();
    this.viewEdit(flatId);
  }

  async delete(id: string) {
    await this.flatService.deleteFlat(id);
  }

  onDeleteClick(event: MouseEvent, flatId: string) {
    event.stopPropagation();
    this.delete(flatId);
  }

  formatAvailableDate(flat: Flat & { id: string }): string {
    const date =
      flat.availableDate instanceof Date
        ? flat.availableDate
        : (flat.availableDate as any)?.toDate?.() ?? null;

    if (!date) return 'Unknown';

    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
      date
    );
  }

  addNewFlat() {
    this.router.navigate(['/flats/new']);
  }

  viewFlat(id: string) {
    this.router.navigate(['/flats', id]);
  }
}
