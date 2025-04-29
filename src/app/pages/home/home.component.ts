import { Component, Signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';

import { FlatService, Flat } from '../../services/flat.service';
import { FavoriteService } from '../../services/favorite.service';

import { AuthService, UserProfile } from '../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    MatMenuModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private flatService = inject(FlatService);
  private favService = inject(FavoriteService);
  private router = inject(Router);

  userSignal = toSignal<UserProfile | null>(this.auth.currentUser$, {
    initialValue: null,
  });

  showFilters = false;

  minPrice = 0;
  maxPrice = 5000;
  minArea = 0;
  maxArea = 500;

  filterForm: FormGroup = this.fb.group({
    city: [''],
    priceStart: [this.minPrice],
    priceEnd: [this.maxPrice],
    areaStart: [this.minArea],
    areaEnd: [this.maxArea],
    sortBy: ['city'],
  });

  private filterValue$ = this.filterForm.valueChanges.pipe(
    startWith(this.filterForm.value)
  );

  filterSignal = toSignal(this.filterValue$, {
    initialValue: this.filterForm.value,
  });

  private allFlatsSignal: Signal<(Flat & { id: string })[] | null> = toSignal(
    this.flatService.getAllFlats(),
    { initialValue: null }
  );

  loading: Signal<boolean> = computed(() => this.allFlatsSignal() === null);

  flatsSignal: Signal<(Flat & { id: string })[]> = computed(() => {
    const flats = this.allFlatsSignal() ?? [];
    const user = this.userSignal();
    const { city, priceStart, priceEnd, areaStart, areaEnd, sortBy } =
      this.filterSignal();

    const normalized = flats.map((f) => ({
      ...f,
      availableDate:
        f.availableDate instanceof Date
          ? f.availableDate
          : (f.availableDate as any)?.toDate?.() ?? new Date(0),
    }));

    const others = normalized.filter((f) =>
      user ? f.ownerUID !== user.uid : true
    );

    const filtered = others.filter(
      (f) =>
        (!city || f.city === city) &&
        f.rentPrice >= priceStart &&
        f.rentPrice <= priceEnd &&
        f.areaSize >= areaStart &&
        f.areaSize <= areaEnd
    );

    return filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Flat]!;
      const bVal = b[sortBy as keyof Flat]!;
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });
  });

  favoritesSignal: Signal<string[]> = toSignal(this.favService.favorites$, {
    initialValue: [],
  });

  get cityOptions(): string[] {
    return Array.from(
      new Set(this.allFlatsSignal()?.map((f) => f.city) ?? [])
    ).sort();
  }

  viewNewFlat() {
    this.router.navigate(['/flats/new']);
  }

  viewFlat(id: string) {
    this.router.navigate(['/flats', id]);
  }

  setSort(key: keyof Flat) {
    this.filterForm.patchValue({ sortBy: key });
  }

  resetFilters() {
    this.filterForm.patchValue({
      city: '',
      priceStart: this.minPrice,
      priceEnd: this.maxPrice,
      areaStart: this.minArea,
      areaEnd: this.maxArea,
    });
  }

  async toggleFavorite(flatId: string) {
    const favs = this.favoritesSignal();
    if (favs.includes(flatId)) {
      await this.favService.removeFavorite(flatId);
    } else {
      await this.favService.addFavorite(flatId);
    }
  }

  isFavorite(flatId: string): boolean {
    return this.favoritesSignal().includes(flatId);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
}
