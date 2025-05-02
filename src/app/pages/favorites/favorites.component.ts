import { Component, Signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { toSignal } from '@angular/core/rxjs-interop';

import { FlatService, Flat } from '../../services/flat.service';
import { FavoriteService } from '../../services/favorite.service';

@Component({
  selector: 'app-favorites',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
})
export class FavoritesComponent {
  private flatService = inject(FlatService);
  private favService = inject(FavoriteService);
  private router = inject(Router);

  private allFlatsSignal: Signal<(Flat & { id: string })[] | null> = toSignal(
    this.flatService.getAllFlats(),
    { initialValue: null }
  );

  favoritesSignal: Signal<string[]> = toSignal(this.favService.favorites$, {
    initialValue: [],
  });

  loading: Signal<boolean> = computed(() => this.allFlatsSignal() === null);

  favoriteFlatsSignal: Signal<(Flat & { id: string })[]> = computed(() => {
    const raw = this.allFlatsSignal() ?? [];
    const favIds = this.favoritesSignal();

    const flats = raw.map((flat) => ({
      ...flat,
      availableDate:
        flat.availableDate instanceof Date
          ? flat.availableDate
          : (flat.availableDate as any)?.toDate?.() ?? new Date(0),
    }));

    return flats.filter((f) => favIds.includes(f.id));
  });

  viewFlat(id: string) {
    this.router.navigate(['/flats', id]);
  }

  async removeFavorite(id: string) {
    await this.favService.removeFavorite(id);
  }

  onRemoveClick(event: MouseEvent, flatId: string) {
    event.stopPropagation();
    this.removeFavorite(flatId);
  }
}
