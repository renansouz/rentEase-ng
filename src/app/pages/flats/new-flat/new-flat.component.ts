import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import { FlatService, Flat } from '../../../services/flat.service';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { toSignal } from '@angular/core/rxjs-interop';

function notInPastValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const val = control.value;
    if (!val) return null;
    const chosen = val instanceof Date ? val : new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return chosen >= today ? null : { datePast: true };
  };
}

@Component({
  selector: 'app-new-flat',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './new-flat.component.html',
  styleUrl: './new-flat.component.css',
})
export class NewFlatComponent {
  private fb = inject(FormBuilder);
  private flatService = inject(FlatService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);

  readonly MAX_FILE_SIZE = 1 * 1024 * 1024;

  userSignal = toSignal(this.auth.currentUser$, { initialValue: null });

  photoDataUrl: string | null = null;
  photoError: string | null = null;

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
    availableDate: [null, [Validators.required, notInPastValidator()]],
  });

  get f() {
    return this.form.controls;
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      this.photoDataUrl = this.photoError = null;
      return;
    }
    if (file.size > this.MAX_FILE_SIZE) {
      this.photoDataUrl = null;
      this.photoError = `File too big (max ${(
        this.MAX_FILE_SIZE /
        1024 /
        1024
      ).toFixed(1)} MB)`;
      return;
    }
    this.photoError = null;
    const reader = new FileReader();
    reader.onload = () => (this.photoDataUrl = reader.result as string);
    reader.readAsDataURL(file);
  }

  async onSubmit() {
    if (this.form.invalid || this.photoError) return;

    const user = this.userSignal();
    if (!user) return;

    const payload: Omit<Flat, 'createdAt'> = {
      ownerUID: user.uid,
      city: this.f['city'].value,
      streetName: this.f['streetName'].value,
      streetNumber: this.f['streetNumber'].value,
      areaSize: this.f['areaSize'].value,
      hasAC: this.f['hasAC'].value,
      yearBuilt: this.f['yearBuilt'].value,
      rentPrice: this.f['rentPrice'].value,
      availableDate: this.f['availableDate'].value,
      ...(this.photoDataUrl ? { photoUrl: this.photoDataUrl } : {}),
    };

    await this.flatService.createFlat(payload);
    this.router.navigate(['/my-flats']);
  }

  goBack() {
    this.location.back();
  }
}
