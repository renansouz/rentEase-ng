import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { map, filter, switchMap } from 'rxjs/operators';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { FlatService, Flat } from '../../../services/flat.service';

@Component({
  selector: 'app-edit-flat',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './edit-flat.component.html',
  styleUrl: './edit-flat.component.css',
})
export class EditFlatComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private flatService = inject(FlatService);
  private router = inject(Router);

  id!: string;

  form: FormGroup = this.fb.group({
    city: ['', Validators.required],
    streetName: ['', Validators.required],
    streetNumber: [null, [Validators.required, Validators.min(1)]],
    areaSize: [null, [Validators.required, Validators.min(1)]],
    hasAC: [false],
    yearBuilt: [
      null,
      [
        Validators.required,
        Validators.min(1900),
        Validators.max(new Date().getFullYear()),
      ],
    ],
    rentPrice: [null, [Validators.required, Validators.min(1)]],
    availableDate: [null, Validators.required],
  });

  ngOnInit() {
    this.form.disable();

    this.route.paramMap
      .pipe(
        map((pm) => pm.get('id')),
        filter((id): id is string => !!id), // Only continue if id exists
        switchMap((id) => {
          this.id = id;
          return this.flatService.getFlat(this.id);
        })
      )
      .subscribe({
        next: (flat) => {
          this.form.patchValue({
            city: flat.city,
            streetName: flat.streetName,
            streetNumber: flat.streetNumber,
            areaSize: flat.areaSize,
            hasAC: flat.hasAC,
            yearBuilt: flat.yearBuilt,
            rentPrice: flat.rentPrice,
            availableDate:
              flat.availableDate instanceof Date
                ? flat.availableDate
                : (flat.availableDate as any)?.toDate?.() ?? null,
          });
          this.form.enable();
        },
        error: (err) => {
          console.error('Failed to load flat:', err);
          alert('Failed to load flat. Please try again.');
          this.router.navigate(['/my-flats']);
        },
      });
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      alert('Please correct the errors before submitting.');
      return;
    }

    try {
      const updates = this.form.value as Partial<Omit<Flat, 'ownerUID'>>;
      await this.flatService.updateFlat(this.id, updates);
      alert('Flat updated successfully!');
      this.router.navigate(['/my-flats']);
    } catch (err) {
      console.error('Failed to update flat:', err);
      alert('Failed to update flat. Please try again.');
    }
  }

  get f() {
    return this.form.controls;
  }
}
