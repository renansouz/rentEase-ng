import {
  Component,
  Signal,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    FormsModule,
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

  searchTerm: WritableSignal<string> = signal('');

  userSignal = toSignal(this.auth.currentUser$, { initialValue: null });
  usersMapSignal: Signal<Record<string, UserProfile>> = toSignal(
    this.auth.usersMap$,
    { initialValue: {} }
  );

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
    hasAc: [null],
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

  flatsSignal: Signal<Array<Flat & { id: string; ownerName: string }>> =
    computed(() => {
      const flats = this.allFlatsSignal() ?? [];
      const usersMap = this.usersMapSignal();
      const { city, priceStart, priceEnd, areaStart, areaEnd, hasAc, sortBy } =
        this.filterSignal();
      const term = this.searchTerm().trim().toLowerCase();

      const enriched = flats.map((f) => {
        const owner = usersMap[f.ownerUID];
        const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : '…';
        return {
          ...f,
          availableDate:
            f.availableDate instanceof Date
              ? f.availableDate
              : (f.availableDate as any)?.toDate?.() ?? new Date(0),
          ownerName,
        };
      });

      let filtered = enriched.filter(
        (f) =>
          (!city || f.city === city) &&
          f.rentPrice >= priceStart &&
          f.rentPrice <= priceEnd &&
          f.areaSize >= areaStart &&
          f.areaSize <= areaEnd &&
          (hasAc === null || f.hasAC === hasAc)
      );

      if (term) {
        filtered = filtered.filter(
          (f) =>
            f.city.toLowerCase().includes(term) ||
            f.ownerName.toLowerCase().includes(term)
        );
      }

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

  onFavoriteClick(event: MouseEvent, flatId: string) {
    event.stopPropagation();
    this.toggleFavorite(flatId);
  }

  isFavorite(flatId: string): boolean {
    return this.favoritesSignal().includes(flatId);
  }

  toggleFilters() {
    this.showFilters = !this.showFilters;
  }
}
