import { Component, Signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { FlatService, Flat } from '../../services/flat.service';
import { AuthService, UserProfile } from '../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private fb = inject(FormBuilder);
  private flatService = inject(FlatService);
  private auth = inject(AuthService);
  private router = inject(Router);

  minPrice = 0;
  maxPrice = 5000;
  minArea = 0;
  maxArea = 500;

  filterForm: FormGroup = this.fb.group({
    city: [''],
    price: [[this.minPrice, this.maxPrice]],
    area: [[this.minArea, this.maxArea]],
    sortBy: ['city'],
  });

  private allFlatsSignal: Signal<(Flat & { id: string })[] | null> = toSignal(
    this.flatService.getAllFlats(),
    { initialValue: null }
  );

  loading: Signal<boolean> = computed(() => this.allFlatsSignal() === null);

  flatsSignal: Signal<(Flat & { id: string })[]> = computed(() => {
    const flats = this.allFlatsSignal() ?? [];
    const { city, price, area, sortBy } = this.filterForm.value;

    const filtered = flats.filter(
      (f) =>
        (!city || f.city === city) &&
        f.rentPrice >= price[0] &&
        f.rentPrice <= price[1] &&
        f.areaSize >= area[0] &&
        f.areaSize <= area[1]
    );

    return filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof Flat]!;
      const bVal = b[sortBy as keyof Flat]!;

      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
  });

  userSignal: Signal<UserProfile | null> = toSignal(this.auth.currentUser$, {
    initialValue: null,
  });

  displayColumns = ['city', 'rentPrice', 'areaSize', 'owner', 'actions'];

  get cityOptions(): string[] {
    return Array.from(
      new Set(this.allFlatsSignal()?.map((f) => f.city) ?? [])
    ).sort();
  }

  viewFlat(id: string) {
    this.router.navigate(['/flats', id]);
  }

  toggleFavorite(id: string) {
    // TODO: integrate FavoriteService
  }

  isFavorite(id: string): boolean {
    // TODO: integrate FavoriteService
    return false;
  }
}
